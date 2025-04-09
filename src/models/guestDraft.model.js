const mongoose = require("mongoose");
const { z } = require("zod");
const {
  datetimeregex,
  nocountrycodephoneregex,
  countrycoderegex,
} = require("../constants/regex.constant");
const logger = require("../configs/winston.config");
const Schema = mongoose.Schema;

const guestDraftSchema = new Schema(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    countryCode: { type: String },
    phoneNumber: { type: String },
    source: { type: String },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    confirmationNumber: { type: String },
    roomNumber: { type: String },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

/**
 * @typedef {import("mongoose").Model<GuestDraft>} GuestDraft
 * @typedef {typeof GuestDraft.schema.obj} GuestDraftType
 */
const GuestDraft = mongoose.model("GuestDraft", guestDraftSchema);
const CreateGuestDraftValidationSchema = z
  .object({
    phoneNumber: z
      .string()
      .optional()
      .refine((val) => !val || nocountrycodephoneregex.test(val), {
        message: "Invalid phone number format",
      }),
    countryCode: z
      .string()
      .optional()
      .refine((val) => !val || countrycoderegex.test(val), {
        message: "Invalid country code format",
      }),
    source: z.string().min(1).optional(),
    checkIn: z
      .string()
      .refine(
        (val) => datetimeregex.test(val) && !Number.isNaN(Date.parse(val)),
        {
          message: "Invalid date format",
        },
      ),
    checkOut: z
      .string()
      .refine(
        (val) => datetimeregex.test(val) && !Number.isNaN(Date.parse(val)),
        {
          message: "Invalid date format",
        },
      ),
    confirmationNumber: z.string().min(1).max(255).optional(),
    roomNumber: z.string().min(1).optional(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email().optional(),
    active: z.boolean().optional(),
  })
  .superRefine((args, ctx) => {
    if (new Date(args.checkIn) >= new Date(args.checkOut)) {
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_date,
        path: ["checkIn"],
        fatal: true,
        message: "chekin date time should be before checkout date time",
      });
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_date,
        path: ["checkOut"],
        fatal: true,
        message: "checkout date time should be after checkin date time",
      });
    }
  });

GuestDraft.init().then(() => {
  logger.info("Initialized GuestDraft Model");
});
module.exports = {
  GuestDraft,
  CreateGuestDraftValidationSchema,
};
