const { Message } = require("twilio/lib/twiml/MessagingResponse");

const create = async (message) => {
  try {
    const newMessage = new Message({
      message: message,
    });
    const savedMessage = await newMessage.save();
    return savedMessage;
  } catch (e) {
    throw new Error("Error creating message" + e);
  }
};

const get = async (propertyId, guestId) => {
  try {
    const messages = await Message.find({
      propertyId: propertyId,
      guestId: guestId,
    });
    return messages;
  } catch (e) {
    throw new Error("Error getting messages" + e);
  }
};

const getById = async (messageId, propertyId, guestId) => {
  try {
    const message = await Message.findOne({
      _id: messageId,
      propertyId: propertyId,
      guestId: guestId,
    });
    if (!message) {
      throw new Error("Message not found");
    }
    return message;
  } catch (e) {
    throw new Error("Error getting message" + e);
  }
};

module.exports = { create, get, getById };
