const { NotFoundError } = require("../lib/CustomErrors");
const { Message } = require("../models/message.model");

const create = async (message) => {
  const newMessage = new Message({
    message: message,
  });
  const savedMessage = await newMessage.save();
  return savedMessage;
};

const getAll = async (propertyId, guestId) => {
  const messages = await Message.find({
    propertyId: propertyId,
    guestId: guestId,
  });
};

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

module.exports = { create, getAll, getById };
