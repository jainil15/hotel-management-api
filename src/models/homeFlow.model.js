const { default: mongoose } = require("mongoose");
const { z } = require("zod");
const logger = require("../configs/winston.config");

const Schema = require("mongoose").Schema;
const amenitiesSchema = new Schema(
  {
    name: { type: String, required: true },
    enabled: { type: Boolean, default: true },
  },
  { _id: false },
);
const frequentlyAskedQuestionsSchema = new Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: false },
);
const homeFlowSchema = new Schema(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    amenities: {
      type: [amenitiesSchema],
      default: [
        {
          name: "Breakfast Included",
          enabled: true,
        },
        {
          name: "24/7 Front Desk",
          enabled: true,
        },
        {
          name: "Free WiFi",
          enabled: true,
        },
        {
          name: "HouseKeeping",
          enabled: true,
        },
        {
          name: "Air conditioning",
          enabled: true,
        },
        {
          name: "Parking Available",
          enabled: true,
        },
        {
          name: "Luggage Storage",
          enabled: true,
        },
      ],
    },
    frequentlyAskedQuestionsEnabled: { type: Boolean, default: true },
    frequentlyAskedQuestions: {
      type: [frequentlyAskedQuestionsSchema],
      default: [
        {
          question: "What time is standard check in?",
          answer: "Check-out is at 3:00 PM.",
        },
      ],
    },
  },
  { timestamps: true },
);

homeFlowSchema.index({ propertyId: 1 }, { unique: true });

/**
 * @typedef {import("mongoose").Model<HomeFlow>} HomeFlow
 * @typedef {typeof HomeFlow.schema.obj} HomeFlowType
 */
const HomeFlow = mongoose.model("HomeFlow", homeFlowSchema);

const CreateHomeFlowValidationSchema = z.object({
  amenities: z.array({
    name: z.string(),
    enabled: z.boolean(),
  }),
  frequentlyAskedQuestionsEnabled: z.boolean().optional(),
  frequentlyAskedQuestions: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    }),
  ),
});

const UpdateHomeFlowValidationSchema = z.object({
  amenities: z
    .array(
      z.object({
        name: z.string().optional(),
        enabled: z.boolean().optional(),
      }),
    )
    .optional(),
  frequentlyAskedQuestionsEnabled: z.boolean().optional(),
  frequentlyAskedQuestions: z
    .array(
      z.object({
        question: z.string().optional(),
        answer: z.string().optional(),
      }),
    )
    .optional(),
});
HomeFlow.init().then(() => {
  logger.info("Initialized HomeFlow Model");
});
module.exports = {
  HomeFlow,
  frequentlyAskedQuestionsSchema,
  UpdateHomeFlowValidationSchema,
  CreateHomeFlowValidationSchema,
};
