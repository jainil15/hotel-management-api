const mongoose = require("mongoose");
const { messageStatusEnum } = require("../constants/template.contant");
const logger = require("../configs/winston.config");
const { z } = require("zod");
const Schema = mongoose.Schema;

const messageTemplateSchema = new Schema(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    status: {
      type: String,
      enum: messageStatusEnum,
      required: true,
    },
    message: { type: String, required: true },
    active: { type: Boolean, default: true, required: true },
  },
  { timestamps: true },
);

const MessageTemplateValidationSchema = z.object({
  propertyId: z.string(),
  status: z.string().refine((val) => messageStatusEnum.includes(val), {
    message: "Invalid message status",
  }),
  message: z.string(),
});

const MessageTemplate = mongoose.model(
  "MessageTemplate",
  messageTemplateSchema,
);

MessageTemplate.init().then(() => {
  logger.info("Initialized MessageTemplate Model");
});

module.exports = { MessageTemplate, MessageTemplateValidationSchema };
