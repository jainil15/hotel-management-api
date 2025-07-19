const { z } = require("zod");
const { phoneregex } = require("../constants/regex.constant");
const logger = require("../configs/winston.config");

const Schema = require("mongoose").Schema;

const addOnNotificationSchema = new Schema(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    addOnId: {
      type: Schema.Types.ObjectId,
      ref: "AddOn",
      required: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    email: {
      type: String,
      lowercase: true,
    },
    phoneNumber: {
      type: String,
      lowercase: true,
    },
  },
  {
    timestamps: true,
  },
);

const UpdateAddOnNotificationSchemaValidation = z.object({
  addOnId: z.string().optional(),
  enabled: z.boolean().optional(),
  email: z.string().email().optional(),
  phoneNumber: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true; // Allow empty string
        return phoneregex.test(val);
      },
      {
        message: "Invalid phone number format",
      },
    ),
});
/*
 * @typedef {import("mongoose").Model<AddOnNotification>} AddOnNotification
 * @typedef {typeof AddOnNotification.schema.obj} AddOnNotificationType
 */
const AddOnNotification = require("mongoose").model(
  "AddOnNotification",
  addOnNotificationSchema,
);
AddOnNotification.init().then(() => {
  logger.info("Initialized AddOnNotification Model");
});

module.exports = { AddOnNotification, UpdateAddOnNotificationSchemaValidation };
