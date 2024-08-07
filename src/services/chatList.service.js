const mongoose = require("mongoose");
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
	const pipeline = [
		// Match the documents with the given propertyId
		{ $match: { propertyId: new mongoose.Types.ObjectId(propertyId) } },

		// Lookup to populate the guestId field
		{
			$lookup: {
				from: "guests", // The name of the Guest collection
				localField: "guestId",
				foreignField: "_id",
				as: "guest",
			},
		},
		{
			$lookup: {
				from: "messages", // The name of the Message collection
				localField: "latestMessage",
				foreignField: "_id",
				as: "latestMessage",
			},
		},
		{
			$lookup: {
				localField: "guestId",
				from: "gueststatuses",
				foreignField: "guestId",
				as: "gueststatus",
			},
		},

		{
			$unwind: "$gueststatus",
		},
		{ $unwind: "$guest" },
		{
			$group: {
				_id: "$propertyId",
				chatLists: { $push: "$$ROOT" },
				totalUnreadMessages: {
					$sum: {
						$cond: { if: { $gte: ["$unreadMessages", 1] }, then: 1, else: 0 },
					},
				},
			},
		},
		{
			$project: {
				_id: 0,
				propertyId: "$_id",

				chatLists: {
					$map: {
						input: "$chatLists",
						as: "chatList",
						in: {
							latestMessageTime: {
								$cond: {
									if: { $gt: [{ $size: "$$chatList.latestMessage" }, 0] },
									then: {
										$arrayElemAt: ["$$chatList.latestMessage.createdAt", 0],
									},
									else: null,
								},
							},
							_id: "$$chatList._id",
							propertyId: "$$chatList.propertyId",
							guestId: "$$chatList.guestId",
							unreadMessages: "$$chatList.unreadMessages",
							latestMessage: "$$chatList.latestMessage",
							createdAt: "$$chatList.createdAt",
							updatedAt: "$$chatList.updatedAt",
							guest: {
								_id: "$$chatList.guest._id",
								countryCode: "$$chatList.guest.countryCode",
								phoneNumber: "$$chatList.guest.phoneNumber",
								source: "$$chatList.guest.source",
								checkIn: "$$chatList.guest.checkIn",
								checkOut: "$$chatList.guest.checkOut",
								confirmationNumber: "$$chatList.guest.confirmationNumber",
								roomNumber: "$$chatList.guest.roomNumber",
								firstName: "$$chatList.guest.firstName",
								lastName: "$$chatList.guest.lastName",
								email: "$$chatList.guest.email",
								active: "$$chatList.guest.active",
								currentStatus: "$$chatList.guest.currentStatus",
								lateCheckOutStatus: "$$chatList.guest.lateCheckOutStatus",
								earlyCheckInStatus: "$$chatList.guest.earlyCheckInStatus",
								reservationStatus: "$$chatList.guest.reservationStatus",
								preArrivalStatus: "$$chatList.guest.preArrivalStatus",
								status: {
									currentStatus: "$$chatList.gueststatus.currentStatus",
									lateCheckOutStatus:
										"$$chatList.gueststatus.lateCheckOutStatus",
									earlyCheckInStatus:
										"$$chatList.gueststatus.earlyCheckInStatus",
									reservationStatus: "$$chatList.gueststatus.reservationStatus",
									preArrivalStatus: "$$chatList.gueststatus.preArrivalStatus",
								},
							},
						},
					},
				},
				latestMessage: "$latestMessage",
				totalUnreadMessages: 1,
			},
		},
		{
			$addFields: {
				chatLists: {
					$sortArray: {
						input: "$chatLists",
						sortBy: { latestMessageTime: -1 },
					},
				},
			},
		},
	];

	const chatList = await ChatList.aggregate(pipeline);
	return chatList[0];
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

/**
 * Update and increment unread messages
 * @param {string} propertyId - propertyId
 * @param {string} guestId - guestId
 * @param {object} chatList - chatList
 * @param {object} session - mongoose session
 * @returns {Promise<ChatList>} - chatList
 */

const updateAndIncUnreadMessages = async (
	propertyId,
	guestId,
	chatList,
	session,
) => {
	const updatedChatList = await ChatList.findOneAndUpdate(
		{ propertyId: propertyId, guestId: guestId },
		{
			...chatList,
			$inc: { unreadMessages: 1 },
		},
		{ new: true, session },
	);
	return updatedChatList;
};

module.exports = {
	create,
	getByPropertyId,
	update,
	remove,
	updateAndIncUnreadMessages,
};
