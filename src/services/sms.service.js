const { NotFoundError } = require("../lib/CustomErrors");
const { Property } = require("../models/property.model");
const twilioAccountService = require("../services/twilioAccount.service");
const guestService = require("../services/guest.service");
const messageService = require("../services/message.service");
const propertyService = require("../services/property.service");
const twilio = require("twilio");
const {
	TWILIO_ACCOUNT_SID,
	TWILIO_AUTH_TOKEN,
} = require("../constants/twilio.constant");
require("dotenv").config();

/**
 * Send Message from twilio Account
 * @param {string} propertyId - property id
 * @param {string} guestId - guest id
 * @param {string} body - message body
 * @param {object} session - mongoose session
 * @returns {object} message - twilio message object
 */
const sendMessage = async (propertyId, guestId, body, session) => {
	const property = propertyService.getById(propertyId);
	if (!property) {
		throw new NotFoundError("Property not found", {
			propertyId: ["Property not found for the given id"],
		});
	}
	const twilioAccount = await twilioAccountService.getByPropertyId({
		propertyId: propertyId,
	});
	if (!twilioAccount) {
		throw new NotFoundError("Twilio Account not found", {
			propertyId: ["Twilio account found for the given property id"],
		});
	}

	const guest = await guestService({ _id: guestId });
	if (!guest) {
		throw new NotFoundError("Guest not found", {
			guestId: ["Guest not found for the given id"],
		});
	}
	const twilioSubClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, {
		accountSid: twilioAccount.sid,
	});
	const message = await twilioSubClient.messages.create({
		body: body,
		from: `${twilioAccount.countryCode}${twilioAccount.phoneNumber}`,
		to: `${guest.countryCode}${guest.phoneNumber}`,
	});
	const newMessage = messageService.create(
		{
			propertyId: propertyId,
			guestId: guestId,
			senderId: propertyId,
			receiverId: guestId,
			content: body,
			messageTriggerType: "Manual",
			messageType: "SMS",
		},
		session,
	);

	return message;
};

/**
 * Broadcast Message to multiple guests
 * @param {string} propertyId - property id
 * @param {string[]} guestIds - array of guest ids
 * @param {string} body - message body
 * @param {object} session - mongoose session
 * @returns {object[]} newMessages - array of new messages
 */
const broadcastMessage = async (propertyId, guestIds, body, session) => {
	const newMessages = [];
	const property = await Property.findById(propertyId);
	if (!property) {
		throw new NotFoundError("Property not found", {
			propertyId: ["Property not found for the given id"],
		});
	}
	const twilioAccount = await twilioAccountService.getByPropertyId({
		propertyId: propertyId,
	});
	if (!twilioAccount) {
		throw new NotFoundError("Twilio Account not found", {
			propertyId: ["Twilio account found for the given property id"],
		});
	}
	const twilioSubClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, {
		accountSid: twilioAccount.sid,
	});
	const guestPhoneNumbers = await guestService.getPhoneNumbers(guestIds);

	for (const guestPhoneNumber of guestPhoneNumbers) {
		const message = await twilioSubClient.messages.create({
			body: body,
			from: `${twilioAccount.countryCode}${twilioAccount.phoneNumber}`,
			to: `${guestPhoneNumber.countryCode}${guestPhoneNumber.phoneNumber}`,
		});
		const newMessage = new messageService(
			{
				propertyId: propertyId,
				guestId: guestPhoneNumber._id,
				senderId: propertyId,
				receiverId: guestPhoneNumber._id,
				content: body,
				messageTriggerType: "Manual",
				messageType: "Broadcast",
			},
			session,
		);
		await newMessages.save({ session: session });
		newMessages.push(newMessage);
	}
	return newMessages;
};

/**
 * Send SMS using twilio client
 * @param {object} client - twilio client object
 * @param {string} from - sender phone number
 * @param {string} to - receiver phone number
 * @param {string} body - message body
 * @returns {object} sentMessage - twilio message object
 */
const send = async (client, from, to, body) => {
	const sentMessage = await client.messages.create({
		body: body,
		from: from,
		to: to,
	});
	return sentMessage;
};

module.exports = { sendMessage, broadcastMessage, send };
