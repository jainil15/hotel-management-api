const { default: mongoose } = require("mongoose");
const { NotFoundError } = require("../lib/CustomErrors");
const { Message } = require("../models/message.model");
const guestService = require("./guest.service");
const logger = require("../configs/winston.config");
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
  const guest = await guestService.getById(guestId, propertyId);
  const time = new Date();
  const messages = await Message.aggregate([
    // 1. Lookup to populate the guest field.
    {
      $lookup: {
        from: "guests",
        localField: "guestId",
        foreignField: "_id",
        as: "guest",
      },
    },

    // 2. Match messages by propertyId and guest phoneNumber & countryCode.
    {
      $match: {
        propertyId: new mongoose.Types.ObjectId(propertyId),
        guest: {
          $elemMatch: {
            phoneNumber: guest.phoneNumber,
            countryCode: guest.countryCode,
          },
        },
      },
    },

    // Optionally, if you also want to match a specific guestId, uncomment below:
    // {
    //   $match: {
    //     guestId: new mongoose.Types.ObjectId(guestId)
    //   }
    // },

    // 3. Lookup for check-in/out requests.
    {
      $lookup: {
        from: "checkinoutrequests",
        localField: "requestId",
        foreignField: "_id",
        as: "request",
      },
    },

    // 4. Lookup for add-ons requests.
    {
      $lookup: {
        from: "addonsrequests",
        localField: "addOnsRequestId",
        foreignField: "_id",
        as: "addOnsRequest",
      },
    },

    // 5. Lookup for do-not-disturb requests.
    {
      $lookup: {
        from: "donotdisturbrequests",
        localField: "dndModeRequestId",
        foreignField: "_id",
        as: "donotdisturbRequest",
      },
    },

    // 6. Unwind the request array while preserving nulls.
    {
      $unwind: {
        path: "$request",
        preserveNullAndEmptyArrays: true,
      },
    },

    // 7. Remove the requestId field from the output.
    {
      $project: {
        requestId: 0,
      },
    },
  ]);

  logger.info(
    `GuestId: ${guestId} PropertyId: ${propertyId} Time taken: ${new Date() - time}ms`,
  );

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
