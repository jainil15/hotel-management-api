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
    email: {
      type: String,
      lowercase: true,
    },
    phoneNumber: {
      type: String,
    },
    countryCode: {
      type: String,
    },
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
    z
      .object({
        addOnId: z.string().optional(),
        enabled: z.boolean().optional(),
        email: z.string().email().optional(),
        countryCode: z.string().optional(),
        phoneNumber: z.string().regex(phoneregex).optional(),
        type: z.string().optional(),
      })
      .superRefine((data, c) => {
        if (data.phoneNumber && !data.countryCode) {
          c.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Country code is required when phone number is provided.",
          });
          return false;
        }
        if (data.countryCode && !data.phoneNumber) {
          c.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Phone number is required when country code is provided.",
          });
          return false;
        }
        return true;
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
