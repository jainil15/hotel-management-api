const { Broadcast } = require("../models/broadcast.model");

/**
 * Get all broadcasts by propertyId
 * @param {string} propertyId - The propertyId to filter broadcasts
 * @returns {Promise<Broadcast[]>} - The list of broadcasts
 */
const getByPropertyId = async (propertyId) => {
	const broadcasts = await Broadcast.find({ propertyId: propertyId });

	return broadcasts;
};

/**
 * Create a new broadcast
 * @param {string} propertyId - The propertyId to filter broadcasts
 * @param {string[]} guestIds - The list of guestIds
 * @param {string[]} messages - The list of messages
 * @returns {Promise<Broadcast>} - The new broadcast
 */
const create = async (propertyId, guestIds, messages) => {
	const broadcast = new Broadcast({
		propertyId: propertyId,
		guestIds: guestIds,
		messages: messages,
	});

	await broadcast.save();

	return broadcast;
};

/**
 * Update a broadcast
 * @param {string} propertyId - The propertyId to filter broadcasts
 * @param {string} broadcastId - The broadcastId to update
 * @param {Broadcast} broadcast - The updated broadcast
 * @returns {Promise<Broadcast>} - The updated broadcast
 */
const update = async (propertyId, broadcastId, broadcast) => {
	const updatedBroadcast = await Broadcast.findOneAndUpdate(
		{ _id: broadcastId, propertyId: propertyId },
		broadcast,
		{ new: true },
	);

	return updatedBroadcast;
};

/**
 * Add messages to a broadcast
 * @param {string} propertyId - The propertyId to filter broadcasts
 * @param {string} broadcastId - The broadcastId to update
 * @param {string[]} messages - The list of messages
 * @returns {Promise<Broadcast>} - The updated broadcast
 */
const addMessages = async (propertyId, broadcastId, messages) => {
	const updatedBroadcast = await Broadcast.findOneAndUpdate(
		{ _id: broadcastId, propertyId: propertyId },
		{ $push: { messages: messages } },
		{ new: true },
	);

	return updatedBroadcast;
};

module.exports = {
	getByPropertyId,
	create,
	update,
	addMessages,
};
