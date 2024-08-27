const mongoose = require("mongoose");
const { requestType } = require("../constants/message.constant");
const { z } = require("zod");
const { datetimeregex } = require("../constants/regex.constant");
const logger = require("../configs/winston.config");
const {
  LATE_CHECK_OUT_STATUS,
  GUEST_REQUEST,
  REQUEST_STATUS,
} = require("../constants/guestStatus.contant");
const Schema = mongoose.Schema;

const checkInOutRequest = new Schema(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    guestId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    requestStatus: {
      type: String,
      enum: [
        REQUEST_STATUS.ACCEPTED,
        REQUEST_STATUS.DECLINED,
        REQUEST_STATUS.REQUESTED,
      ],
      default: REQUEST_STATUS.REQUESTED,
    },
    requestType: {
      type: String,
      enum: Object.keys(requestType),
      required: true,
    },
    earlyCheckInDateTime: {
      type: Date,
    },
    lateCheckOutDateTime: {
      type: Date,
    },
  },
  { timestamps: true },
);

const CreateCheckInOutRequestValidationSchema = z
  .object({
    requestType: z.enum(Object.keys(requestType)),
    earlyCheckInDateTime: z
      .string()
      .refine(
        (val) => datetimeregex.test(val) && !Number.isNaN(Date.parse(val)),
        {
          message: "Invalid date format",
        },
      )
      .optional(),
    requestStatus: z
      .enum([
        REQUEST_STATUS.ACCEPTED,
        REQUEST_STATUS.DECLINED,
        REQUEST_STATUS.REQUEST,
      ])
      .optional(),
    lateCheckOutDateTime: z
      .string()
      .refine(
        (val) => datetimeregex.test(val) && !Number.isNaN(Date.parse(val)),
        {
          message: "Invalid date format",
        },
      )
      .optional(),
  })
  .superRefine((arg, ctx) => {
    if (arg.requestType === "earlyCheckIn" && !arg.earlyCheckInDateTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_arguments,
        path: ["earlyCheckInDateTime"],
        message: "Early check in date time is required",
      });
    }
    if (arg.requestType === "lateCheckOut" && !arg.lateCheckOutDateTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_arguments,
        path: ["lateCheckOutDateTime"],
        message: "Late check out date time is required",
      });
    }
    if (arg.earlyCheckInDateTime && arg.lateCheckOutDateTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_date,
        path: ["earlyCheckInDateTime"],
        fatal: true,
        message: "Cannot request both early check in and late check out",
      });
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_date,
        path: ["lateCheckOutDateTime"],
        fatal: true,
        message: "Cannot request both early check in and late check out",
      });
    }
  });

const UpdateRequestStatusValidationSchema = z.object({
  requestStatus: z.enum([
    REQUEST_STATUS.ACCEPTED,
    REQUEST_STATUS.DECLINED,
    REQUEST_STATUS.REQUESTED,
  ]),
});

const UpdateCheckInOutRequestValidationSchema = z
  .object({
    requestStatus: z.enum([
      REQUEST_STATUS.ACCEPTED,
      REQUEST_STATUS.DECLINED,
      REQUEST_STATUS.REQUESTED,
    ]),

    requestType: z.enum(Object.keys(GUEST_REQUEST)),
    earlyCheckInDateTime: z
      .string()
      .refine(
        (val) => datetimeregex.test(val) && !Number.isNaN(Date.parse(val)),
        {
          message: "Invalid date format",
        },
      )
      .optional(),
    lateCheckOutDateTime: z
      .string()
      .refine(
        (val) => datetimeregex.test(val) && !Number.isNaN(Date.parse(val)),
        {
          message: "Invalid date format",
        },
      )
      .optional(),
  })
  .superRefine((arg, ctx) => {
    if (arg.requestType === "earlyCheckIn" && !arg.earlyCheckInDateTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_arguments,
        path: ["earlyCheckInDateTime"],
        message: "Early check in date time is required",
      });
    }
    if (arg.requestType === "lateCheckOut" && !arg.lateCheckOutDateTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_arguments,
        path: ["lateCheckOutDateTime"],
        message: "Late check out date time is required",
      });
    }
    if (arg.earlyCheckInDateTime && arg.lateCheckOutDateTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_date,
        path: ["earlyCheckInDateTime"],
        fatal: true,
        message: "Cannot request both early check in and late check out",
      });
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_date,
        path: ["lateCheckOutDateTime"],
        fatal: true,
        message: "Cannot request both early check in and late check out",
      });
    }
  });

/**
 * @typedef {import("mongoose").Model<CheckInOutRequest>} CheckInOutRequest
 * @typedef {typeof CheckInOutRequest.schema.obj} CheckInOutRequestType
 */
const CheckInOutRequest = mongoose.model(
  "CheckInOutRequest",
  checkInOutRequest,
);

CheckInOutRequest.init().then(() => {
  logger.info("Initialized CheckInOutRequest model");
});

module.exports = {
  CheckInOutRequest,
  CreateCheckInOutRequestValidationSchema,
  UpdateRequestStatusValidationSchema,
  UpdateCheckInOutRequestValidationSchema,
};
