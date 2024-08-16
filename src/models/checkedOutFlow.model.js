const { z } = require("zod");
const { frequentlyAskedQuestionsSchema } = require("./homeFlow.model");
const logger = require("../configs/winston.config");

const Schema = require("mongoose").Schema;

const checkedOutFlowSchema = new Schema(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    frequentlyAskedQuestionsEnabled: { type: Boolean, default: true },
    frequentlyAskedQuestions: {
      type: [frequentlyAskedQuestionsSchema],
      default: [],
    },
  },
  { timestamps: true },
);

/**
 * @typedef {import('mongoose').Model<CheckedOutFlow>} CheckedOutFlow
 * @typedef {typeof CheckedOutFlow.schema.obj} CheckedOutFlowType
 */
const CheckedOutFlow = require("mongoose").model(
  "CheckedOutFlow",
  checkedOutFlowSchema,
);

const CreateCheckedOutFlowValidationSchema = z.object({
  frequentlyAskedQuestionsEnabled: z.boolean(),
  frequentlyAskedQuestions: z.array({
    question: z.string(),
    answer: z.string(),
  }),
});

const UpdateCheckedOutFlowValidationSchema = z.object({
  frequentlyAskedQuestionsEnabled: z.boolean().optional(),
  frequentlyAskedQuestions: z
    .array({
      question: z.string(),
      answer: z.string(),
    })
    .optional(),
});

CheckedOutFlow.init().then(() => {
  logger.info("Initialized CheckedOutFlow Model");
});

module.exports = {
  CheckedOutFlow,
  CreateCheckedOutFlowValidationSchema,
  UpdateCheckedOutFlowValidationSchema,
};
