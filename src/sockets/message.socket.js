const { NotFoundError } = require("../lib/CustomErrors");
const { MessageValidationSchema } = require("../models/message.model");
const guestService = require("../services/guest.service");
const messageService = require("../services/message.service");
const propertyService = require("../services/property.service");
const twilio = require("twilio");
const client = new twilio(
	process.env.TWILIO_ACCOUNT_SID,
	process.env.TWILIO_AUTH_TOKEN,
);

/**
 * Message socket
 * @param {import('socket.io').Server} io - socket io
 * @param {import('socket.io').Socket} socket - socket
 */
module.exports = (io, socket) => {
	//useless
	const sendsms = async (payload) => {
		const message = payload;
		const result = MessageValidationSchema.safeParse(message);
		if (!result.success) {
			io.emit("error", { error: result.error.flatten().fieldErrors });
		}
		const guest = await guestService.getById(
			message.guestId,
			message.propertyId,
		);
		const property = await propertyService.getById(message.propertyId);
		const sentMessage = await client.messages.create({
			body: result.data.content,
			from: property.countryCode + property.phoneNumber,
			to: guest.countryCode + guest.phoneNumber,
		});
		const newMessage = await messageService.create({
			...result.data,
			propertyId: message.propertyId,
			guestId: message.guestId,
			senderId: message.propertyId,
			receiverId: message.guestId,
		});

		io.emit("message:sent", newMessage);
	};

	/**
	 * Join room
	 * @param {object} payload - Payload
	 * @param {string} payload.guestId - Guest ID
	 * @param {string} payload.propertyId - Property ID
	 * @returns {Promise<void>} - Promise
	 */
	const joinRoom = async (payload) => {
		const guest = await guestService.getById(
			payload.guestId,
			payload.propertyId,
		);
		if (!guest) {
			return io
				.to(`property:${payload.propertyId}`)
				.emit(
					"error",
					NotFoundError("Guest not found", { guestId: "Guest not found" }),
				);
		}
		socket.join(`guest:${payload.guestId}`);
	};

	/**
	 * Leave room
	 * @param {object} payload - Payload
	 * @param {string} payload.guestId - Guest ID
	 * @param {string} payload.propertyId - Property ID
	 * @returns {Promise<void>} - Promise
	 */
	const leaveRoom = async (payload) => {
		const guest = await guestService.getById(
			payload.guestId,
			payload.propertyId,
		);
		
		if (!guest) {
			return io
				.to(`property:${payload.propertyId}`)
				.emit(
					"error",
					NotFoundError("Guest not found", { guestId: "Guest not found" }),
				);
		}
		socket.leave(`guest:${payload.guestId}`);
	};

	// useless - maybe used in the future
	const getAllMessages = async (payload) => {
		const { propertyId } = socket.handshake.query;
		const messages = await messageService.getAll(propertyId, payload.guestId);
		io.emit("message:getAll", messages);
	};
	socket.on("message:joinRoom", joinRoom);
	socket.on("message:leaveRoom", leaveRoom);

	// Useless code
	socket.on("message:send", sendsms);
	socket.on("message:getAll", getAllMessages);
};
