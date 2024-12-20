const { default: mongoose } = require("mongoose");
const {
  APIError,
  InternalServerError,
  NotFoundError,
} = require("../lib/CustomErrors");
const { responseHandler } = require("../middlewares/response.middleware");
const broadcastService = require("../services/broadcast.service");
const propertyService = require("../services/property.service");
const twilioAccountService = require("../services/twilioAccount.service");
const twilioService = require("../services/twilio.service");
const guestService = require("../services/guest.service");
const messageService = require("../services/message.service");
const chatListService = require("../services/chatList.service");
const broadcastMessageService = require("../services/broadcastMessage.service");
const {
  messageTriggerType,
  messageType,
} = require("../constants/message.constant");

/**
 * Create broadcast message and send message to all guests in the broadcast
 * @param {import('express').Request} req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {Promise<import('express').Response>} - The response
 */
const create = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    //
    const { propertyId } = req.params;
    const { guestIds, body } = req.body;

    const newMessages = [];
    const property = await propertyService.getById(propertyId);
    if (!property) {
      throw new NotFoundError("Property not found", {
        propertyId: ["Property not found for the given id"],
      });
    }
    const twilioAccount =
      await twilioAccountService.getByPropertyId(propertyId);
    if (!twilioAccount) {
      throw new NotFoundError("Twilio Account not found", {
        propertyId: ["Twilio account found for the given property id"],
      });
    }
    const twilioSubClient = await twilioService.getTwilioClient(twilioAccount);
    const guestPhoneNumbers = await guestService.getPhoneNumbers(guestIds);
    const newBroadcastMessage = await broadcastMessageService.create(
      propertyId,
      guestIds,
      body,
      session,
    );
    for (const guestPhoneNumber of guestPhoneNumbers) {
      const message = await twilioSubClient.messages.create({
        body: body,
        from: `${twilioAccount.countryCode}${twilioAccount.phoneNumber}`,
        to: `${guestPhoneNumber.countryCode}${guestPhoneNumber.phoneNumber}`,
        statusCallback: process.env.TWILIO_STATUS_CALLBACK,
      });
      const newMessage = await messageService.create(
        {
          propertyId: propertyId,
          guestId: guestPhoneNumber._id,
          senderId: propertyId,
          receiverId: guestPhoneNumber._id,
          content: body,
          messageTriggerType: messageTriggerType.BROADCAST,
          messageType: messageType.SMS,
          messageSid: message.sid,
        },
        session,
      );

      const newChatList = await chatListService.update(
        propertyId,
        guestPhoneNumber._id,
        {
          latestMessage: newMessage._id,
        },
        session,
      );

      newMessages.push(newMessage);
    }

    const newBroadcast = await broadcastService.create(
      propertyId,
      guestIds,
      newBroadcastMessage._id,
    );

    await session.commitTransaction();
    session.endSession();

    // biome-ignore lint/complexity/noForEach: <explanation>
    guestPhoneNumbers.forEach((guestPhoneNumber) => {
      req.app.io
        .to(`guest:${guestPhoneNumber._id}`)
        .emit("message:newMessage", {});
    });

    req.app.io.to(`property:${propertyId}`).emit("broadcast:newBroadcast", {
      broadcast: newBroadcast,
    });
    req.app.io.to(`property:${propertyId}`).emit("chatList:update", {});

    return responseHandler(res, { broadcast: newBroadcast });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();

    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

/**
 * Update broadcast by id
 * @param {import('express').Request} req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {Promise<import('express').Response>} - The response
 */
const update = async (req, res, next) => {
  try {
    const { propertyId, broadcastId } = req.params;
    const broadcast = req.body;
    const updatedBroadcast = await broadcastService.update(
      propertyId,
      broadcastId,
      broadcast,
    );
    return responseHandler(res, { broadcast: updatedBroadcast });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

/**
 * Send message to all guests in a broadcast
 * @param {import('express').Request} req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {Promise<import('express').Response>} - The response
 */
const sendMessage = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { propertyId, broadcastId } = req.params;
    const { body } = req.body;
    const broadcast = await broadcastService.getById(broadcastId);

    const guestIds = broadcast.guestIds;

    const newMessages = [];

    const property = await propertyService.getById(propertyId);

    if (!property) {
      throw new NotFoundError("Property not found", {
        propertyId: ["Property not found for the given id"],
      });
    }

    const twilioAccount =
      await twilioAccountService.getByPropertyId(propertyId);

    if (!twilioAccount) {
      throw new NotFoundError("Twilio Account not found", {
        propertyId: ["Twilio account found for the given property id"],
      });
    }

    const twilioSubClient = await twilioService.getTwilioClient(twilioAccount);
    const guestPhoneNumbers = await guestService.getPhoneNumbers(guestIds);

    const newBroadcastMessage = await broadcastMessageService.create(
      propertyId,
      guestIds,
      body,
      session,
    );

    for (const guestPhoneNumber of guestPhoneNumbers) {
      const message = await twilioSubClient.messages.create({
        body: body,
        from: `${twilioAccount.countryCode}${twilioAccount.phoneNumber}`,
        to: `${guestPhoneNumber.countryCode}${guestPhoneNumber.phoneNumber}`,
        statusCallback: process.env.TWILIO_STATUS_CALLBACK,
      });

      const newMessage = await messageService.create(
        {
          propertyId: propertyId,
          guestId: guestPhoneNumber._id,
          senderId: propertyId,
          receiverId: guestPhoneNumber._id,
          content: body,
          messageTriggerType: messageTriggerType.BROADCAST,
          messageType: messageType.SMS,
          messageSid: message.sid,
        },
        session,
      );

      await chatListService.update(
        propertyId,
        guestPhoneNumber._id,
        {
          latestMessage: newMessage._id,
        },
        session,
      );

      newMessages.push(newMessage);
    }

    const updatedBroadcast = await broadcastService.addMessages(
      propertyId,
      broadcastId,
      newBroadcastMessage._id,
      session,
    );

    await session.commitTransaction();
    session.endSession();

    // biome-ignore lint/complexity/noForEach: <explanation>
    guestPhoneNumbers.forEach((guestPhoneNumber) => {
      req.app.io
        .to(`guest:${guestPhoneNumber._id}`)
        .emit("message:newMessage", {});
    });

    req.app.io.to(`property:${propertyId}`).emit("broadcast:newBroadcast", {
      broadcast: updatedBroadcast,
    });
    req.app.io.to(`property:${propertyId}`).emit("chatList:update", {});

    return responseHandler(res, { broadcast: updatedBroadcast });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();

    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

/**
 * Get all broadcasts by property id
 * @param {import('express').Request} req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {Promise<import('express').Response>} - The response
 */
const getAllByPropertyId = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const broadcasts = await broadcastService.getAllBroadcasts(propertyId);
    return responseHandler(res, { broadcasts });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

/**
 * Get broadcast by id
 * @param {import('express').Request} req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {Promise<import('express').Response>} - The response
 */
const getById = async (req, res, next) => {
  try {
    const { broadcastId } = req.params;
    const broadcast = await broadcastService.getById(broadcastId);
    return responseHandler(res, { broadcast: broadcast });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

/**
 * bad code
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const doeverything = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { propertyId } = req.params;
    const { broadcastId, body } = req.body;
    console.log("broadcastId", broadcastId, propertyId);
    if (broadcastId) {
      const broadcast = await broadcastService.getById(broadcastId);
      if (!broadcast) {
        throw new NotFoundError("Broadcast not found", {
          broadcastId: ["Broadcast not found for the given id"],
        });
      }

      let guestIds = broadcast.guestIds;
      if (req.body.guestIds) {
        const reqGuestIds = req.body.guestIds;
        if (guestIds !== reqGuestIds) {
          const updatedBroadcastGuestIds = await broadcastService.update(
            propertyId,
            broadcastId,
            { guestIds: reqGuestIds },
            session,
          );

          guestIds = updatedBroadcastGuestIds.guestIds;
        }
      }

      const newMessages = [];

      const property = await propertyService.getById(propertyId);

      if (!property) {
        throw new NotFoundError("Property not found", {
          propertyId: ["Property not found for the given id"],
        });
      }

      const twilioAccount =
        await twilioAccountService.getByPropertyId(propertyId);

      if (!twilioAccount) {
        throw new NotFoundError("Twilio Account not found", {
          propertyId: ["Twilio account found for the given property id"],
        });
      }

      const twilioSubClient =
        await twilioService.getTwilioClient(twilioAccount);
      const guestPhoneNumbers = await guestService.getPhoneNumbers(guestIds);

      const newBroadcastMessage = await broadcastMessageService.create(
        propertyId,
        guestIds,
        body,
        session,
      );

      for (const guestPhoneNumber of guestPhoneNumbers) {
        const message = await twilioSubClient.messages.create({
          body: body,
          from: `${twilioAccount.countryCode}${twilioAccount.phoneNumber}`,
          to: `${guestPhoneNumber.countryCode}${guestPhoneNumber.phoneNumber}`,
          statusCallback: process.env.TWILIO_STATUS_CALLBACK,
        });

        const newMessage = await messageService.create(
          {
            propertyId: propertyId,
            guestId: guestPhoneNumber._id,
            senderId: propertyId,
            receiverId: guestPhoneNumber._id,
            content: body,
            messageTriggerType: messageTriggerType.BROADCAST,
            messageType: messageType.SMS,
            messageSid: message.sid,
          },
          session,
        );

        await chatListService.update(
          propertyId,
          guestPhoneNumber._id,
          {
            latestMessage: newMessage._id,
          },
          session,
        );

        newMessages.push(newMessage);
      }

      const updatedBroadcast = await broadcastService.addMessages(
        propertyId,
        broadcastId,
        newBroadcastMessage._id,
        session,
      );

      await session.commitTransaction();
      session.endSession();

      // biome-ignore lint/complexity/noForEach: <explanation>
      guestPhoneNumbers.forEach((guestPhoneNumber) => {
        req.app.io
          .to(`guest:${guestPhoneNumber._id}`)
          .emit("message:newMessage", {});
      });

      req.app.io.to(`property:${propertyId}`).emit("broadcast:newBroadcast", {
        broadcast: updatedBroadcast,
      });
      req.app.io.to(`property:${propertyId}`).emit("chatList:update", {});

      return responseHandler(res, { broadcast: updatedBroadcast });
      // biome-ignore lint/style/noUselessElse: <explanation>
    } else {
      const { guestIds, body } = req.body;

      const newMessages = [];
      const property = await propertyService.getById(propertyId);
      if (!property) {
        throw new NotFoundError("Property not found", {
          propertyId: ["Property not found for the given id"],
        });
      }
      const twilioAccount =
        await twilioAccountService.getByPropertyId(propertyId);
      if (!twilioAccount) {
        throw new NotFoundError("Twilio Account not found", {
          propertyId: ["Twilio account found for the given property id"],
        });
      }
      const twilioSubClient =
        await twilioService.getTwilioClient(twilioAccount);
      const guestPhoneNumbers = await guestService.getPhoneNumbers(guestIds);
      const newBroadcastMessage = await broadcastMessageService.create(
        propertyId,
        guestIds,
        body,
        session,
      );
      for (const guestPhoneNumber of guestPhoneNumbers) {
        const message = await twilioSubClient.messages.create({
          body: body,
          from: `${twilioAccount.countryCode}${twilioAccount.phoneNumber}`,
          to: `${guestPhoneNumber.countryCode}${guestPhoneNumber.phoneNumber}`,
          statusCallback: process.env.TWILIO_STATUS_CALLBACK,
        });
        const newMessage = await messageService.create(
          {
            propertyId: propertyId,
            guestId: guestPhoneNumber._id,
            senderId: propertyId,
            receiverId: guestPhoneNumber._id,
            content: body,
            messageTriggerType: messageTriggerType.BROADCAST,
            messageType: messageType.SMS,
            messageSid: message.sid,
          },
          session,
        );

        const newChatList = await chatListService.update(
          propertyId,
          guestPhoneNumber._id,
          {
            latestMessage: newMessage._id,
          },
          session,
        );

        newMessages.push(newMessage);
      }

      const newBroadcast = await broadcastService.create(
        propertyId,
        guestIds,
        newBroadcastMessage._id,
      );

      await session.commitTransaction();
      session.endSession();

      // biome-ignore lint/complexity/noForEach: <explanation>
      guestPhoneNumbers.forEach((guestPhoneNumber) => {
        req.app.io
          .to(`guest:${guestPhoneNumber._id}`)
          .emit("message:newMessage", {});
      });

      req.app.io.to(`property:${propertyId}`).emit("broadcast:newBroadcast", {
        broadcast: newBroadcast,
      });
      req.app.io.to(`property:${propertyId}`).emit("chatList:update", {});

      return responseHandler(res, { broadcast: newBroadcast });
    }
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

module.exports = {
  create,
  update,
  sendMessage,
  getAllByPropertyId,
  getById,
  doeverything,
};
