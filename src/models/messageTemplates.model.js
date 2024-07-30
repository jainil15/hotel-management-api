const mongoose = require("mongoose");
const { messageStatusEnum } = require("../constants/template.contant");

const logger = require("../configs/winston.config");
const { z } = require("zod");
const {
  GUEST_CURRENT_STATUS,
  RESERVATION_STATUS,
  LATE_CHECK_OUT_STATUS,
  EARLY_CHECK_IN_STATUS,
} = require("../constants/guestStatus.contant");
const {
  MESSAGE_TEMPLATE_TYPES,
} = require("../constants/messageTemplate.contant");
const Schema = mongoose.Schema;

const messageTemplateSchema = new Schema(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(MESSAGE_TEMPLATE_TYPES),
      default: MESSAGE_TEMPLATE_TYPES.CUSTOM,
    },
    name: { type: String, required: true },
    message: { type: String, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);
messageTemplateSchema.index({ propertyId: 1, name: 1 }, { unique: true });
const MessageTemplateValidationSchema = z.object({
  propertyId: z.string(),
  name: z.string(),
  type: z.enum(Object.values(MESSAGE_TEMPLATE_TYPES)),
  message: z.string(),
  active: z.boolean().optional(),
});

const CreateMessageTemplateValidationSchema = z.object({
  name: z.string(),
  message: z.string(),
  type: z.enum(Object.values(MESSAGE_TEMPLATE_TYPES)).optional(),
  active: z.boolean().optional(),
});

const UpdateMessageTemplateValidationSchema = z.object({
  name: z.string().optional(),
  message: z.string().optional(),
  type: z.enum(Object.values(MESSAGE_TEMPLATE_TYPES)).optional(),
  active: z.boolean().optional(),
});

const MessageTemplate = mongoose.model(
  "MessageTemplate",
  messageTemplateSchema
);

MessageTemplate.init().then(() => {
  logger.info("Initialized MessageTemplate Model");
});

module.exports = {
  MessageTemplate,
  MessageTemplateValidationSchema,
  UpdateMessageTemplateValidationSchema,
  CreateMessageTemplateValidationSchema,
};
