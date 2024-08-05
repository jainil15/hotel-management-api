const { NotFoundError } = require("../lib/CustomErrors");
const { Message } = require("../models/message.model");

/**
 * Create a new message
 * @param {object} message - The message object
 * @param {object} session - The mongoose session
 * @returns {Promise<Message>} - The saved message
 */
const create = async (message, session) => {
	const newMessage = new Message(message);
	const savedMessage = await newMessage.save({ session: session });
	return savedMessage;
};

/**
 * get all messages between a property and a guest
 * @param {string} propertyId - The property id
 * @param {string} guestId - The guest id
 * @returns {Promise<Message[]>} - The list of messages
 */
const getAll = async (propertyId, guestId) => {
	const messages = await Message.find({
		propertyId: propertyId,
		guestId: guestId,
	});
	return messages;
};

/**
 * Get a message by id
 * @param {string} messageId - The message id
 * @param {string} propertyId - The property id
 * @param {string} guestId - The guest id
 * @returns {Promise<Message>} - The message
 */
const getById = async (messageId, propertyId, guestId) => {
	const message = await Message.findOne({
		_id: messageId,
		propertyId: propertyId,
		guestId: guestId,
	});
	if (!message) {
		throw new NotFoundError("Message not found", {
			messageId: ["Message not found for the given id"],
		});
	}
	return message;
};

/**
 * Update the status of a message
 * @param {string} messageSid - The message sid
 * @param {string} status - The new status
 * @param {object} session - The mongoose session
 * @returns {Promise<Message>} - The updated message
 */
const updateStatus = async (messageSid, status, session) => {
	const updatedMessage = await Message.findOneAndUpdate(
		{ messageSid: messageSid },
		{ $set: { status: status } },
		{ new: true, session: session },
	);
	if (!updatedMessage) {
		throw new NotFoundError("Message not found", {
			messageId: ["Message not found for the given id"],
		});
	}
	return updatedMessage;
};

module.exports = { create, getAll, getById, updateStatus };
