const { default: mongoose } = require("mongoose");
const { NotFoundError } = require("../lib/CustomErrors");
const { Message } = require("../models/message.model");

/**
 * Create a new message
 * @param {import('../models/message.model').MessageType} message - The message object
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
	const messages = await Message.aggregate([
		{
			$match: {
				propertyId: new mongoose.Types.ObjectId(propertyId),
				guestId: new mongoose.Types.ObjectId(guestId),
			},
		},
		{
			$lookup: {
				from: "checkinoutrequests",
				localField: "requestId",
				foreignField: "_id",
				as: "request",
			},
		},
		{
			$unwind: {
				path: "$request",
				preserveNullAndEmptyArrays: true,
			},
		},
		{
			$project: {
				requestId: 0,
			},
		},
	]);

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
	const message = await Message.aggregate([
		{
			$match: {
				_id: new mongoose.Types.ObjectId(messageId),
				propertyId: new mongoose.Types.ObjectId(propertyId),
				guestId: new mongoose.Types.ObjectId(guestId),
			},
		},
		{
			$lookup: {
				from: "checkinoutrequests",
				localField: "requestId",
				foreignField: "_id",
				as: "request",
			},
		},
		{
			$unwind: {
				path: "$request",
				preserveNullAndEmptyArrays: true,
			},
		},
		{
			$project: {
				requestId: 0,
			},
		},
	]);

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
