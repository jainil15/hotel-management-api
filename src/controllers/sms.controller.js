const { default: mongoose } = require("mongoose");
const smsService = require("../services/sms.service");
const twilioAccountService = require("../services/twilioAccount.service");
const guestService = require("../services/guest.service");
const propertyService = require("../services/property.service");
const messageService = require("../services/message.service");
const chatListService = require("../services/chatList.service");
const twilio = require("twilio");
const { responseHandler } = require("../middlewares/response.middleware");
const {
	APIError,
	InternalServerError,
	NotFoundError,
} = require("../lib/CustomErrors");
const {
	TWILIO_ACCOUNT_SID,
	TWILIO_AUTH_TOKEN,
} = require("../constants/twilio.constant");
const {
	messageTriggerType,
	messageType,
} = require("../constants/message.constant");
const logger = require("../configs/winston.config");
require("dotenv").config();

/**
 * Send SMS to guest
 * @param {import('express').Request} req - request object
 * @param {import('express').Response} res - response object
 * @param {import('express').NextFunction} next - next middleware
 * @returns {object} response - response object
 */
const send = async (req, res, next) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		const { propertyId, guestId } = req.params;
		const { body } = req.body;

		const property = propertyService.getById(propertyId);
		const twilioAccount =
			await twilioAccountService.getByPropertyId(propertyId);
		if (!twilioAccount) {
			throw new NotFoundError("Twilio Account not found", {
				propertyId: ["Twilio account found for the given property id"],
			});
		}
		const guest = await guestService.getById(guestId, propertyId);
		if (!guest) {
			throw new NotFoundError("Guest not found", {
				guestId: ["Guest not found for the given id"],
			});
		}

		const twilioSubClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, {
			accountSid: twilioAccount.sid,
		});
		const message = await smsService.send(
			twilioSubClient,
			`${twilioAccount.countryCode}${twilioAccount.phoneNumber}`,
			`${guest.countryCode}${guest.phoneNumber}`,
			body,
		);

		const newMessage = await messageService.create(
			{
				propertyId: propertyId,
				guestId: guestId,
				senderId: propertyId,
				receiverId: guestId,
				content: body,
				messageTriggerType: messageTriggerType.MANUAL,
				messageType: messageType.SMS,
				messageSid: message.sid,
			},
			session,
		);

		const updatedChatList = await chatListService.update(
			propertyId,
			guestId,
			{
				latestMessage: newMessage._id,
			},
			session,
		);

		req.app.io.to(`property:${propertyId}`).emit("chatList:update", {
			chatList: updatedChatList,
		});
		req.app.io.to(`guest:${guestId}`).emit("message:newMessage", {
			message: newMessage,
		});

		await session.commitTransaction();
		session.endSession();
		return responseHandler(res, {}, 200, "Message sent successfully");
	} catch (e) {
		await session.abortTransaction();
		session.endSession();
		if (e instanceof APIError) {
			return next(e);
		}
		return next(new InternalServerError(e.message));
	}
};

/**
 * receive SMS from guest
 * @param {import('express').Request} req - request object
 * @param {import('express').Response} res - response object
 * @param {import('express').NextFunction} next - next middleware
 * @returns {object} response - response object
 */
const receive = async (req, res, next) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		

		logger.error(req.body);
		const { From, To, Body, MessageSid } = req.body;
		const twilioAccount = await twilioAccountService.findOne({
			phoneNumber: To.substring(To.length - 10),
		});
		To.substring(To.length - 10);
		if (!twilioAccount) {
			throw new NotFoundError("Twilio Account not found", {
				phoneNumber: ["Twilio account found for the given phone number"],
			});
		}
		
		const guest = await guestService.find({
			propertyId: twilioAccount.propertyId,
			phoneNumber: From.substring(From.length - 10),
		});
		
		if (!guest) {
			throw new NotFoundError("Guest not found", {
				phoneNumber: ["Guest not found for the given phone number"],
			});
		}

		const newMessage = await messageService.create({
			propertyId: twilioAccount.propertyId,
			guestId: guest._id,
			senderId: guest._id,
			receiverId: twilioAccount.propertyId,
			content: Body,
			messageTriggerType: messageTriggerType.MANUAL,
			messageType: messageType.SMS,
			messageSid: MessageSid,
		});

		const updatedChatList = await chatListService.updateAndIncUnreadMessages(
			twilioAccount.propertyId,
			guest._id,
			{
				latestMessage: newMessage._id,
			},
		);

		await session.commitTransaction();
		session.endSession();

		req.app.io.to(`property:${twilioAccount.propertyId}`).emit("chatList:update", {
			chatList: updatedChatList,
		});
		req.app.io.to(`guest:${guest._id}`).emit("message:newMessage", {
			message: newMessage,
		});
		return responseHandler(res, {}, 200, "Message received successfully");
	} catch (e) {
		await session.abortTransaction();
		session.endSession();
		if (e instanceof APIError) {
			return next(e);
		}
		return next(new InternalServerError(e.message));
	}
};

/**
 * Receive SMS status update from twilio
 * @param {import('express').Request} req - request object
 * @param {import('express').Response} res - response object
 * @param {import('express').NextFunction} next - next middleware
 * @returns {object} response - response object
 */
const status = async (req, res, next) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		const messageSid = req.body.MessageSid;
		const messageStatus = req.body.SmsStatus;

		const updatedMessage = await messageService.updateStatus(
			messageSid,
			messageStatus,
			session,
		);

		await session.commitTransaction();
		session.endSession();
		req.app.io
			.to(`guest:${updatedMessage.guestId}`)
			.emit("message:updateStatus", {
				message: updatedMessage,
			});
		responseHandler(res, {}, 200, "Status received");
	} catch (e) {
		await session.abortTransaction();
		session.endSession();
		if (e instanceof APIError) {
			return next(e);
		}
		return next(new InternalServerError(e.message));
	}
};

module.exports = {
	send,
	receive,
	status,
};
