const mongoose = require("mongoose");
const { ChatList } = require("../models/chatList.model");
const logger = require("../configs/winston.config");
const { GUEST_CURRENT_STATUS } = require("../constants/guestStatus.contant");
const { Guest } = require("../models/guest.model");
/**
 * Create a chat list for a property and guest
 * @param {string} propertyId - propertyId
 * @param {string} guestId - guestId
 * @param {object} session - mongoose session
 * @returns {Promise<import('../models/chatList.model').ChatListType>} - chatList
 */
const create = async (propertyId, guestId, session) => {
  const newChatList = new ChatList({
    propertyId: propertyId,
    guestId: guestId,
  });
  const savedChatList = await newChatList.save({ session });
  return savedChatList;
};

const getByPropertyIdv2 = async (propertyId) => {};

/**
 * Get chat list by propertyId
 * @param {string} propertyId - propertyId
 * @returns {Promise<import('../models/chatList.model').ChatListType[]>} - chatList
 */
const getByPropertyId = async (propertyId) => {
  const pipeline = [
    // 1. Match the documents with the given propertyId.
    {
      $match: { propertyId: new mongoose.Types.ObjectId(propertyId) },
    },

    // 2. Lookup to populate the guest field.
    {
      $lookup: {
        from: "guests",
        localField: "guestId",
        foreignField: "_id",
        as: "guest",
      },
    },
    // 3. Lookup to populate the latestMessage field.
    {
      $lookup: {
        from: "messages",
        localField: "latestMessage",
        foreignField: "_id",
        as: "latestMessage",
      },
    },
    // 4. Lookup to populate the gueststatus field.
    {
      $lookup: {
        from: "gueststatuses",
        localField: "guestId",
        foreignField: "guestId",
        as: "gueststatus",
      },
    },

    // 5. Unwind arrays for guest and gueststatus.
    { $unwind: "$gueststatus" },
    { $unwind: "$guest" },

    // 6. Create a unique identifier combining countryCode and phoneNumber.
    {
      $addFields: {
        uniquePhone: {
          $concat: ["$guest.countryCode", "-", "$guest.phoneNumber"],
        },
      },
    },

    // 7. Add a computed field to check if the guest is currently checked in.
    // {
    //   $addFields: {
    //     currentlyCheckedIn2: {
    //       $cond: {
    //         if: {
    //           $and: [
    //             { $lte: ["$guest.checkIn", "$$NOW"] },
    //             { $gte: ["$guest.checkOut", "$$NOW"] },
    //           ],
    //         },
    //         then: 1,
    //         else: 0,
    //       },
    //     },
    //   },
    // },

    {
      $addFields: {
        currentlyCheckedIn: {
          $cond: {
            if: {
              $and: [
                {
                  $eq: [
                    "$gueststatus.currentStatus",
                    GUEST_CURRENT_STATUS.IN_HOUSE,
                  ],
                },
                { $lt: ["$guest.checkIn", "$$NOW"] },
                { $gt: ["$guest.checkOut", "$$NOW"] },
                {
                  $eq: [
                    "$gueststatus.reservationStatus",
                    GUEST_CURRENT_STATUS.RESERVED,
                  ],
                },
              ],
            },
            then: 1,
            else: 0,
          },
        },
      },
    },

    // 8. Sort by currentlyCheckedIn (desc) and then by guest.checkIn (desc).
    {
      $sort: {
        currentlyCheckedIn: -1,
        "guest.checkIn": -1,
      },
    },
    // 9. Group by uniquePhone to pick the best chat for each phone number.
    {
      $group: {
        _id: "$uniquePhone",
        latestChat: { $first: "$$ROOT" },
      },
    },

    // 10. Replace the root with the selected chat document.
    {
      $replaceRoot: { newRoot: "$latestChat" },
    },

    // 11. Group by propertyId to accumulate all unique chats.
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

    // 12. Project the required fields and reformat chatLists.
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
                createdAt: "$$chatList.guest.createdAt",
                updatedAt: "$$chatList.guest.updatedAt",
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

    // 13. Optionally, sort the chatLists array by latestMessageTime descending.
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

  const time = Date.now();
  const chatList = await ChatList.aggregate(pipeline);
  logger.info(`End time: ${Date.now() - time}ms`);
  return chatList[0];
};

/**
 * Update a chat list
 * @param {string} propertyId - propertyId
 * @param {string} guestId - guestId
 * @param {import('../models/chatList.model').ChatListType} chatList - chatList
 * @param {object} session - mongoose session
 * @returns {Promise<import('../models/chatList.model').ChatListType>} - chatList
 */
const update = async (propertyId, guestId, chatList, session) => {
  const updatedChatList = await ChatList.findOneAndUpdate(
    { propertyId: propertyId, guestId: guestId },
    chatList,
    { new: true, session, retryWrites: true },
  );
  return updatedChatList;
};

/**
 * Remove a chat list
 * @param {string} propertyId - propertyId
 * @param {string} guestId - guestId
 * @param {object} session - mongoose session
 * @returns {Promise<import('../models/chatList.model').ChatListType>} - chatList
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
 * @param {import('../models/chatList.model').ChatListType} chatList - chatList
 * @param {object} session - mongoose session
 * @param {number} unreadMessages - unread messages by default 1
 * @returns {Promise<import('../models/chatList.model').ChatListType>} - chatList
 */
const updateAndIncUnreadMessages = async (
  propertyId,
  guestId,
  chatList,
  session,
  unreadMessages = 1,
) => {
  const updatedChatList = await ChatList.findOneAndUpdate(
    { propertyId: propertyId, guestId: guestId },
    {
      ...chatList,
      $inc: { unreadMessages: unreadMessages },
    },
    { new: true, session },
  );
  return updatedChatList;
};

const upsert = async (propertyId, guestId, session) => {
  const existingChatList = await ChatList.findOne({
    propertyId: propertyId,
    guestId: guestId,
  });
  if (existingChatList) {
    return existingChatList;
  }
  const newChatList = new ChatList({
    propertyId: propertyId,
    guestId: guestId,
  });
  const savedChatList = await newChatList.save({ session });
  return savedChatList;
};

const resetUnreadMessages = async (
  countryCode,
  phoneNumber,
  propertyId,
  session,
) => {
  const guests = await Guest.find({
    propertyId,
    countryCode,
    phoneNumber,
  }).select("_id");

  const guestIds = guests.map((g) => g._id);

  if (guestIds.length === 0) {
    return { matchedCount: 0, modifiedCount: 0 }; // or throw if needed
  }
  const chatList = await ChatList.updateMany(
    {
      propertyId,
      guestId: { $in: guestIds },
      unreadMessages: { $gt: 0 },
    },
    { $set: { unreadMessages: 0 } },
    { session },
  );

  return chatList;
};

module.exports = {
  create,
  getByPropertyId,
  update,
  remove,
  updateAndIncUnreadMessages,
  upsert,
  resetUnreadMessages,
};
