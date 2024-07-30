const {
  DEFAULT_MESSAGE_TEMPLATES,
  MESSAGE_TEMPLATE_TYPES,
} = require("../constants/messageTemplate.contant");
const { MessageTemplate } = require("../models/messageTemplates.model");

const createDefaults = async (propertyId, session) => {
  try {
    const messageTemplates = [];

    for (const [status, messages] of Object.entries(
      DEFAULT_MESSAGE_TEMPLATES
    )) {
      for (const [statusValue, message] of Object.entries(messages)) {
        const newMessageTemplate = new MessageTemplate({
          propertyId,
          type: MESSAGE_TEMPLATE_TYPES.DEFAULT,
          name: `${message.name}`,
          message: message.message,
        });

        messageTemplates.push(await newMessageTemplate.save({ session }));
      }
    }
    return messageTemplates;
  } catch (e) {
    throw e;
  }
};

const getAll = async (propertyId) => {
  const messageTemplates = await MessageTemplate.find({ propertyId });
  return messageTemplates;
};

const create = async (propertyId, messageTemplate, session) => {
  const newMessageTemplate = new MessageTemplate({
    propertyId,
    ...messageTemplate,
  });
  await newMessageTemplate.save({ session: session });
  return newMessageTemplate;
};

const getById = async (propertyId, messageTemplateId) => {
  const messageTemplate = await MessageTemplate.findById(messageTemplateId);
  return messageTemplate;
};

const update = async (
  propertyId,
  messageTemplateId,
  messageTemplate,
  session
) => {
  const updatedMessageTemplate = await MessageTemplate.findOneAndUpdate(
    { _id: messageTemplateId, propertyId: propertyId },
    messageTemplate,
    { new: true, session: session }
  );
  return updatedMessageTemplate;
};
const getByNameAndPropertyId = async (name, propertyId) => {
  const messageTemplate = await MessageTemplate.findOne({
    name,
    propertyId,
  });
  return messageTemplate;
};
const remove = async (messageTemplateId, session) => {
  const removedMessageTemplate = await MessageTemplate.findByIdAndDelete(
    messageTemplateId,
    { session: session }
  );
  return removedMessageTemplate;
};

const updateAll = async (propertyId, messageTemplates, session) => {
  const updatedMessageTemplates = await MessageTemplate.updateMany(
    { propertyId },
    messageTemplates,
    { session: session }
  );
  return updatedMessageTemplates;
};

module.exports = {
  getAll,
  create,
  getById,
  update,
  remove,
  createDefaults,
  getByNameAndPropertyId,
  updateAll,
};
