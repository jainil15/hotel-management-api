const {
  DEFAULT_MESSAGE_TEMPLATES,
  MESSAGE_TEMPLATE_TYPES,
} = require("../constants/messageTemplate.contant");
const { MessageTemplate } = require("../models/messageTemplates.model");
const {
  guestStatusToTemplateOnCreate,
  guestStatusToTemplateOnUpdate,
} = require("../utils/guestStatustToTemplate");

/**
 * Create default message templates
 * @param {string} propertyId - The property id
 * @param {object} session - The mongoose session
 * @returns {Promise<MessageTemplate[]>} - The saved message templates
 */
const createDefaults = async (propertyId, session) => {
  const messageTemplates = [];

  for (const [status, messages] of Object.entries(DEFAULT_MESSAGE_TEMPLATES)) {
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
  const newMessageTemplate = new MessageTemplate({
    propertyId,
    type: MESSAGE_TEMPLATE_TYPES.DEFAULT,
    name: "Early Check In Accepted and Late Check Out Accepted",
    message: "Your early check in and late check out request is accepted",
  });
  messageTemplates.push(await newMessageTemplate.save({ session }));
  return messageTemplates;
};

/**
 * Get all message templates by propertyId
 * @param {string} propertyId - The property id
 * @returns {Promise<MessageTemplate[]>} - The list of message templates
 */
const getAll = async (propertyId) => {
  const messageTemplates = await MessageTemplate.find({ propertyId });
  return messageTemplates;
};

/**
 * Create a new message template
 * @param {string} propertyId - The property id
 * @param {object} messageTemplate - The message template object
 * @param {object} session - The mongoose session
 * @returns {Promise<MessageTemplate>} - The saved message template
 */
const create = async (propertyId, messageTemplate, session) => {
  const newMessageTemplate = new MessageTemplate({
    propertyId,
    ...messageTemplate,
  });
  await newMessageTemplate.save({ session: session });
  return newMessageTemplate;
};

/**
 * Get a message template by id
 * @param {string} propertyId - The property id
 * @param {string} messageTemplateId - The message template id
 * @returns {Promise<MessageTemplate>} - The message template
 */
const getById = async (propertyId, messageTemplateId) => {
  const messageTemplate = await MessageTemplate.findById(messageTemplateId);
  return messageTemplate;
};

/**
 * Update a message template
 * @param {string} propertyId - The property id
 * @param {string} messageTemplateId - The message template id
 * @param {object} messageTemplate - The updated message template
 * @param {object} session - The mongoose session
 * @returns {Promise<MessageTemplate>} - The updated message template
 */
const update = async (
  propertyId,
  messageTemplateId,
  messageTemplate,
  session,
) => {
  const updatedMessageTemplate = await MessageTemplate.findOneAndUpdate(
    { _id: messageTemplateId, propertyId: propertyId },
    messageTemplate,
    { new: true, session: session },
  );
  return updatedMessageTemplate;
};

/**
 * Get message template by name and propertyId
 * @param {string} propertyId - The property id
 * @param {string} name - The message template name
 * @returns {Promise<import('../models/messageTemplates.model').MessageTemplateType>} - The message template
 */
const getByNameAndPropertyId = async (propertyId, name) => {
  const messageTemplate = await MessageTemplate.findOne({
    name,
    propertyId,
  });
  return messageTemplate;
};

/**
 * Remove a message template
 * @param {string} messageTemplateId - The message template id
 * @param {object} session - The mongoose session
 * @returns {Promise<MessageTemplate>} - The removed message template
 */
const remove = async (messageTemplateId, session) => {
  const removedMessageTemplate = await MessageTemplate.findByIdAndDelete(
    messageTemplateId,
    { session: session },
  );
  return removedMessageTemplate;
};

/**
 * Update all message templates
 * @param {string} propertyId - The property id
 * @param {object} messageTemplates - The updated message templates
 * @param {object} session - The mongoose session
 * @returns {Promise<MessageTemplate[]>} - The updated message templates
 */
const updateAll = async (propertyId, messageTemplates, session) => {
  const updatedMessageTemplates = await MessageTemplate.updateMany(
    { propertyId },
    messageTemplates,
    { session: session },
  );
  return updatedMessageTemplates;
};

/**
 * Get message template by status
 * @param {string} propertyId - The property id
 * @param {import('../models/guestStatus.model').GuestStatusType} status - The message template status
 * @param {string} messageTemplateName - The message template name
 * @returns {Promise<import('../models/messageTemplates.model').MessageTemplateType>} - The message template
 */
const getMessageTemplateByStatus = async (
  propertyId,
  status,
  messageTemplateName,
) => {
  const messageTemplate = await MessageTemplate.findOne({
    propertyId: propertyId,
    name: messageTemplateName,
  });
  return messageTemplate;
};

/**
 * Update message template by name
 * @param {string} propertyId - The property id
 * @param {string} name - The message template name
 * @param {object} messageTemplate - The updated message template
 * @param {object} session - The mongoose session
 * @returns {Promise<import('../models/messageTemplates.model').MessageTemplateType>} - The updated message template
 */
const updateByName = async (propertyId, name, messageTemplate, session) => {
  const updatedMessageTemplate = await MessageTemplate.findOneAndUpdate(
    { propertyId, name },
    messageTemplate,
    { new: true, session: session },
  );
  return updatedMessageTemplate;
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
  getMessageTemplateByStatus,
  updateByName,
};
