const { BroadcastMessage } = require("../models/broadcastMessage.model");

/**
 * Create a broadcast message
 * @param {string} propertyId - propertyId
 * @param {string} guestIds - guestIds
 * @param {string} content - content
 * @param {object} session - mongoose session
 * @returns {Promise<import('../models/broadcastMessage.model').BroadcastMessageType>} - The new broadcast message
 */
const create = async (propertyId, guestIds, content, session) => {
	const broadcastMessage = new BroadcastMessage({
		propertyId: propertyId,
		guestIds: guestIds,
		content: content,
	});
	await broadcastMessage.save({ session });
	return broadcastMessage;
};

module.exports = {
	create,
};
