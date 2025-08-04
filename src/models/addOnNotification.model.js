const { z } = require("zod");
const { phoneregex } = require("../constants/regex.constant");
const logger = require("../configs/winston.config");
const requestType = require("../constants/message.constant").requestType;

const Schema = require("mongoose").Schema;

const AddOnNotifictionDetails = new Schema(
  {
    addOnId: {
      type: Schema.Types.ObjectId,
      ref: "AddOn",
      required: true,
    },
    type: {
      type: String,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    emails: {
      type: [String],
      lowercase: true,
    },
    phoneNumbers: [
      {
        countryCode: {
          type: String,
          default: null,
        },
        phoneNumber: {
          type: String,
          default: null,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);
AddOnNotifictionDetails.index({ addOnId: 1 }, { unique: true });

const AddOnNotificationSchema = new Schema(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    addOnNotifications: [AddOnNotifictionDetails],
  },
  {
    timestamps: true,
  },
);
const UpdateAddOnNotificationSchema = z.object({
  propertyId: z.string().optional(),
  addOnNotifications: z.array(
    z.object({
      addOnId: z.string().optional(),
      enabled: z.boolean().optional(),
      emails: z
        .array(z.string().email())
        .optional()
        .transform((emails) => emails.map((email) => email.toLowerCase())),
      phoneNumbers: z.array(
        z
          .object({
            countryCode: z.string().optional(),
            phoneNumber: z.string().regex(phoneregex).optional(),
          })
          .superRefine((value, ctx) => {
            if (!value.countryCode && !value.phoneNumber) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Either countryCode or phoneNumber must be provided",
              });
            }
          }),
      ),
      type: z.string().optional(),
    }),
  ),
});
/**
 * @typedef {import("mongoose").Model<AddOnNotifictionDetails> } AddOnNotifictionDetails
 * @typedef {typeof AddOnNotifictionDetails.schema.obj} AddOnNotifictionDetailsType
 */

/**
 * @typedef {import("mongoose").Model<AddOnNotification>} AddOnNotification
 * @typedef {typeof AddOnNotification.schema.obj} AddOnNotificationType
 */

const AddOnNotification = require("mongoose").model(
  "PropertyNotification",
  AddOnNotificationSchema,
);
AddOnNotification.init().then(() => {
  logger.info("Initialized AddOnNotification Model");
});

module.exports = {
  AddOnNotification,
  UpdateAddOnNotificationSchema,
};
