const { default: mongoose } = require("mongoose");
const { z } = require("zod");
const logger = require("../configs/winston.config");
const Schema = mongoose.Schema;
const customAddOnsSchema = new Schema(
  {
    addOnType: { type: String, default: "CustomAddon" },
    name: { type: String, required: true },
    description: { type: String },
    addonNote: { type: String },
    paid: { type: Boolean, default: true },
    price: { type: Number },
    enabled: { type: Boolean, default: true },
    default: { type: Boolean, default: true },
    image: {
      type: String,
    },
  },
  {},
);
const checkInOutAddOnsSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    addonNote: { type: String },
    defaultTimeEnabled: { type: Boolean, required: true },
    defaultTiming: { type: String },
    customTiming: { type: String, required: true },
    paid: { type: Boolean, required: true },
    price: { type: Number, required: true },
    enabled: { type: Boolean, default: true },
    default: { type: Boolean, default: true },
    image: {
      type: [String],
    },
  },
  {},
);
const houseKeepingAddOnsSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    enabled: { type: Boolean, default: true },
    default: { type: Boolean, default: true },
    image: {
      type: [String],
    },
    options: { type: [String], default: [] },
  },
  {},
);
const upgradeRoomSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    enabled: { type: Boolean, default: true },
    default: { type: Boolean, default: true },
    image: { type: [String] },
    options: [
      {
        roomNumber: { type: String, required: true },
        roomType: { type: String, required: true },
      },
    ],
  },
  {},
);

const addOnsFlowSchema = new Schema(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    customAddOns: { type: [customAddOnsSchema], default: [] },
    checkInOutAddOns: {
      type: [checkInOutAddOnsSchema],
      default: [
        {
          name: "Early Check In",
          description:
            "Early check-in lets guests access their accommodations before the standard check-in time for added convenience.",
          defaultTimeEnabled: false,
          defaultTiming: "14:00",
          customTiming: "14:00",
          paid: false,
          price: 0,
          enabled: true,
          image: [
            "https://onelyk-images-bucket.s3.amazonaws.com/addOns/checkin.png",
          ],

          default: true,
        },
        {
          name: "Late Check Out",
          description:
            "Late check-out allows guests to extend their stay beyond the standard check-out time, providing extra time to relax or prepare for departure.",
          defaultTimeEnabled: false,
          defaultTiming: "12:00",
          customTiming: "12:00",
          paid: false,
          price: 0,
          enabled: true,
          image: [
            "https://onelyk-images-bucket.s3.amazonaws.com/addOns/late-check-out-in-hotel.jpg",
          ],
          default: true,
        },
      ],
    },
    houseKeepingAddOns: {
      type: houseKeepingAddOnsSchema,
      default: {
        name: "House Keeping",
        description:
          "Housekeeping services include cleaning and tidying guest rooms, making beds, changing bed linens, and replenishing towels and toiletries.",
        enabled: true,
        default: true,
        image: [
          "https://onelyk-images-bucket.s3.amazonaws.com/addOns/house-keeping.jpg",
        ],
        options: [],
      },
    },
    upgradeRoom: {
      type: upgradeRoomSchema,
      default: {
        name: "Upgrade Room",
        description: "Upgrade to a better room type.",
        enabled: true,
        default: true,
        image: [
          "https://onelyk-images-bucket.s3.amazonaws.com/addOns/upgrade-room.jpg",
        ],
        options: [],
      },
    },
  },
  { timestamps: true },
);

addOnsFlowSchema.index({ propertyId: 1 }, { unique: true });

/**
 * @typedef {import("mongoose").Model<AddOnsFlow>} AddOnsFlow
 * @typedef {typeof AddOnsFlow.schema.obj} AddOnsFlowType
 */
const AddOnsFlow = mongoose.model("AddOnsFlow", addOnsFlowSchema);

const CreateAddOnsFlowValidationSchema = z.object({
  customAddOns: z.array(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      paid: z.boolean(),
      price: z.number().optional(),
      enabled: z.boolean(),
      default: z.boolean(),
      addonNote: z.string().optional(),
      addOnType: z.string().optional(),
      image: z.string().optional(),
    }),
  ),
  checkInOutAddOns: z.array(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      defaultTimeEnabled: z.boolean(),
      defaultTiming: z.string().optional(),
      customTiming: z.string(),
      addonNote: z.string().optional(),
      paid: z.boolean(),
      price: z.number(),
      enabled: z.boolean(),
      default: z.boolean(),
      //image: z.string().optional(),
    }),
  ),
  houseKeepingAddOns: z
    .object({
      name: z.string().optional(),
      description: z.string().optional(),
      enabled: z.boolean().optional(),
      default: z.boolean().optional(),
      image: z.any(),
      options: z.array(z.string().min(1)).optional(),
    })
    .optional(),
  upgradeRoom: z
    .object({
      name: z.string().optional(),
      description: z.string().optional(),
      enabled: z.boolean().optional(),
      default: z.boolean().optional(),
      image: z.any(),
      options: z
        .array(
          z.object({
            roomNumber: z.string(),
            roomType: z.string(),
          }),
        )
        .optional(),
    })
    .optional(),
});

const UpdateAddOnsFlowValidationSchema = z.object({
  customAddOns: z
    .array(
      z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        paid: z.boolean().optional(),
        price: z.number().optional(),
        enabled: z.boolean().optional(),
        default: z.boolean().optional(),
        addOnType: z.string().optional(),
        addonNote: z.string().optional(),
        image: z.any(),
      }),
    )
    .optional(),
  checkInOutAddOns: z
    .array(
      z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        defaultTimeEnabled: z.boolean().optional(),
        defaultTiming: z.string().optional(),
        customTiming: z.string().optional(),
        paid: z.boolean().optional(),
        price: z.number().optional(),
        enabled: z.boolean().optional(),
        default: z.boolean().optional(),
        addonNote: z.string().optional(),
        // image: z.string().optional(),
      }),
    )
    .optional(),
  houseKeepingAddOns: z
    .object({
      name: z.string().optional(),
      description: z.string().optional(),
      enabled: z.boolean().optional(),
      default: z.boolean().optional(),
      image: z.any(),
      options: z.array(z.string().min(1)).optional(),
    })
    .optional(),
  upgradeRoom: z
    .object({
      name: z.string().optional(),
      description: z.string().optional(),
      enabled: z.boolean().optional(),
      default: z.boolean().optional(),
      image: z.any(),
      options: z
        .array(
          z.object({
            roomNumber: z.string(),
            roomType: z.string(),
          }),
        )
        .optional(),
    })
    .optional(),
});

/**
 * @typedef {import("mongoose").Model<AddOnsFlow>} AddOnsFlow
 * @typedef {typeof AddOnsFlow.schema.obj} AddOnsFlowType
 */
AddOnsFlow.init().then(() => {
  logger.info("Initialized AddOnsFlow Model");
});

module.exports = {
  AddOnsFlow,
  CreateAddOnsFlowValidationSchema,
  UpdateAddOnsFlowValidationSchema,
};
