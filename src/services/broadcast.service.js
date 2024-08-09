const { default: mongoose } = require("mongoose");
const { NotFoundError } = require("../lib/CustomErrors");
const { Broadcast } = require("../models/broadcast.model");

/**
 * Get all broadcasts by propertyId
 * @param {string} propertyId - The propertyId to filter broadcasts
 * @returns {Promise<import('../models/broadcast.model').BroadcastType[]>} - The list of broadcasts
 */
const getByPropertyId = async (propertyId) => {
	const broadcasts = await Broadcast.find({ propertyId: propertyId });

	return broadcasts;
};

/**
 * Create a new broadcast
 * @param {string} propertyId - The propertyId to filter broadcasts
 * @param {string[]} guestIds - The list of guestIds
 * @param {string} broadcastMessageId - The list of messages
 * @param {object} session - The mongoose session
 * @returns {Promise<Broadcast>} - The new broadcast
 */
const create = async (propertyId, guestIds, broadcastMessageId, session) => {
	const broadcast = new Broadcast({
		propertyId: propertyId,
		guestIds: guestIds,
		broadcastMessageIds: [broadcastMessageId],
	});
	await broadcast.save({ session: session });
	return broadcast;
};

/**
 * Update a broadcast
 * @param {string} propertyId - The propertyId to filter broadcasts
 * @param {string} broadcastId - The broadcastId to update
 * @param {Broadcast} broadcast - The updated broadcast
 * @param {object} session - The mongoose session
 * @returns {Promise<import('../models/broadcast.model').BroadcastType>} - The updated broadcast
 */
const update = async (propertyId, broadcastId, broadcast, session) => {
	const updatedBroadcast = await Broadcast.findOneAndUpdate(
		{ _id: broadcastId, propertyId: propertyId },
		broadcast,
		{ new: true, session: session },
	);

	return updatedBroadcast;
};

/**
 * Add messages to a broadcast
 * @param {string} propertyId - The propertyId to filter broadcasts
 * @param {string} broadcastId - The broadcastId to update
 * @param {string} broadcastMessageId - The list of messages
 * @param {object} session - The mongoose session
 * @returns {Promise<import('../models/broadcast.model').BroadcastType>} - The updated broadcast
 */
const addMessages = async (
	propertyId,
	broadcastId,
	broadcastMessageId,
	session,
) => {
	const updatedBroadcast = await Broadcast.findOneAndUpdate(
		{ _id: broadcastId, propertyId: propertyId },
		{ $push: { broadcastMessageIds: broadcastMessageId } },
		{ new: true, session: session },
	);

	return updatedBroadcast;
};

/**
 * Get all broadcasts
 * @param {string} propertyId - The propertyId to filter broadcasts
 * @returns {Promise<import('../models/broadcast.model').BroadcastType[]>} - The list of broadcasts
 */
const getAllBroadcasts = async (propertyId) => {
	const broadcasts = await Broadcast.aggregate([
		{
			$match: {
				propertyId: new mongoose.Types.ObjectId(propertyId),
			},
		},
		{
			$lookup: {
				from: "broadcastmessages",
				localField: "broadcastMessageIds",
				foreignField: "_id",
				as: "broadcastMessages",
			},
		},

		{
			$project: {
				broadcastMessageIds: 0,
			},
		},
	]);

	return broadcasts;
};

/**
 * Get broadcast by id
 * @param {string} broadcastId - The broadcastId to filter broadcasts
 * @returns {Promise<import('../models/broadcast.model').BroadcastType>} - The broadcast
 */
const getById = async (broadcastId) => {
	const broadcast = await Broadcast.findOne({ _id: broadcastId }).populate(
		"broadcastMessageIds",
	);
	if (!broadcast) {
		throw new NotFoundError("Broadcast not found", {
			broadcastId: ["Broadcast not found for the given id"],
		});
	}
	return broadcast;
};

module.exports = {
	getByPropertyId,
	create,
	update,
	addMessages,
	getById,
	getAllBroadcasts,
};
