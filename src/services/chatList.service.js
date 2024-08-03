const { ChatList } = require("../models/chatList.model");

/**
 * Create a chat list for a property and guest
 * @param {string} propertyId - propertyId
 * @param {string} guestId - guestId
 * @param {object} session - mongoose session
 * @returns {Promise<ChatList>} - chatList
 */
const create = async (propertyId, guestId, session) => {
	const newChatList = new ChatList({
		propertyId: propertyId,
		guestId: guestId,
	});
	const savedChatList = await newChatList.save({ session });
	return savedChatList;
};

/**
 * Get chat list by propertyId
 * @param {string} propertyId - propertyId
 * @returns {Promise<ChatList>} - chatList
 */
const getByPropertyId = async (propertyId) => {
	const chatList = await ChatList.find({ propertyId: propertyId });
	return chatList;
};

/**
 * Update a chat list
 * @param {string} propertyId - propertyId
 * @param {string} guestId - guestId
 * @param {object} chatList - chatList
 * @param {object} session - mongoose session
 * @returns {Promise<ChatList>} - chatList
 */
const update = async (propertyId, guestId, chatList, session) => {
	const updatedChatList = await ChatList.findOneAndUpdate(
		{ propertyId: propertyId, guestId: guestId },
		chatList,
		{ new: true, session },
	);
	return updatedChatList;
};

/**
 * Remove a chat list
 * @param {string} propertyId - propertyId
 * @param {string} guestId - guestId
 * @param {object} session - mongoose session
 * @returns {Promise<ChatList>} - chatList
 */
const remove = async (propertyId, guestId, session) => {
	const chatList = await ChatList.findOneAndDelete(
		{ propertyId: propertyId, guestId: guestId },
		{ session },
	);
	return chatList;
};

module.exports = { create, getByPropertyId, update, remove };
