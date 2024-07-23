const { MessageTemplate } = require("../models/messageTemplates.model");

const getAll = async (propertyId) => {
  const messageTemplates = await MessageTemplate.find({ propertyId });
  return messageTemplates;
};

const create = async (propertyId, messageTemplate) => {
  const newMessageTemplate = new MessageTemplate({
    propertyId,
    ...messageTemplate,
  });
  await newMessageTemplate.save();
  return newMessageTemplate;
};

const getById = async (messageTemplateId) => {
  const messageTemplate = await Message.findById(messageTemplateId);
  return messageTemplate;
};

const update = async (messageTemplateId, messageTemplate) => {
  const updatedMessageTemplate = await MessageTemplate.findByIdAndUpdate(
    messageTemplateId,
    messageTemplate,
  );
  return updatedMessageTemplate;
};

const remove = async (messageTemplateId) => {
  const removedMessageTemplate =
    await MessageTemplate.findByIdAndDelete(messageTemplateId);
  return removedMessageTemplate;
};

module.exports = {
  getAll,
  create,
  getById,
  update,
  remove,
};
