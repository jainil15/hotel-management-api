const { default: mongoose } = require("mongoose");
const { z } = require("zod");

const Schema = require("mongoose").Schema;

const homeFlowSchema = new Schema({
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: "Property",
    required: true,
  },
  ammenities: [
    {
      name: { type: String, required: true },
      iconUrl: { type: String, required: true },
    },
  ],
  frequentlyAskedQuestionsEnabled: { type: Boolean, default: true },
  frequentlyAskedQuestions: [
    {
      question: { type: String, required: true },
      answer: { type: String, required: true },
    },
  ],
});

homeFlowSchema.index({ propertyId: 1 }, { unique: true });

/**
 * @typedef {import("mongoose").Model<HomeFlow>} HomeFlow
 * @typedef {typeof HomeFlow.schema.obj} HomeFlowType
 */
const HomeFlow = mongoose.model("HomeFlow", homeFlowSchema);

const CreateHomeFlowValidationSchema = z.object({
  ammenities: z.array({
    name: z.string(),
    iconUrl: z.string(),
  }),
  frequentlyAskedQuestionsEnabled: z.boolean().optional(),
  frequentlyAskedQuestions: z.array({
    question: z.string(),
    answer: z.string(),
  }),
});

const UpdateHomeFlowValidationSchema = z.object({
  ammenities: z
    .array({
      name: z.string().optional(),
      iconUrl: z.string().optional(),
    })
    .optional(),
  frequentlyAskedQuestionsEnabled: z.boolean().optional(),
  frequentlyAskedQuestions: z
    .array({
      question: z.string().optional(),
      answer: z.string().optional(),
    })
    .optional(),
});

module.exports = {
  HomeFlow,
  UpdateHomeFlowValidationSchema,
  CreateHomeFlowValidationSchema,
};
