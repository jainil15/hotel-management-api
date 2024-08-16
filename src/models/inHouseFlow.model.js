const { default: mongoose } = require("mongoose");
const { frequentlyAskedQuestionsSchema } = require("./homeFlow.model");
const { z } = require("zod");
const logger = require("../configs/winston.config");

const Schema = mongoose.Schema;

const inHouseFlowSchema = new Schema(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    frequentlyAskedQuestionsEnabled: { type: Boolean, default: true },
    frequentlyAskedQuestions: {
      type: frequentlyAskedQuestionsSchema,
      default: [],
    },
  },
  { timestamps: true },
);

/**
 * @typedef {import("mongoose").Model<InHouseFlow>} InHouseFlow
 * @typedef {typeof InHouseFlow.schema.obj} InHouseFlowType
 */
const InHouseFlow = mongoose.model("InHouseFlow", inHouseFlowSchema);

const CreateInHouseFlowValidationSchema = z.object({
  frequentlyAskedQuestionsEnabled: z.boolean(),
  frequentlyAskedQuestions: z.array({
    question: z.string(),
    answer: z.string(),
  }),
});

const UpdateInHouseFlowValidationSchema = z.object({
  frequentlyAskedQuestionsEnabled: z.boolean().optional(),
  frequentlyAskedQuestions: z
    .array({
      question: z.string(),
      answer: z.string(),
    })
    .optional(),
});
InHouseFlow.init().then(() => {
  logger.info("Initialized InHouseFlow Model");
});
module.exports = { InHouseFlow };
