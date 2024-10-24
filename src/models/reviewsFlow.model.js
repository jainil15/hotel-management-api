const { default: mongoose } = require("mongoose");
const { z } = require("zod");
const logger = require("../configs/winston.config");

const Schema = mongoose.Schema;

const reviewsFlowSchema = new Schema(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },

    reviewsEnabled: { type: Boolean, default: true },
    startLimitForReviewLink: { type: Number, default: 3 },
    reviewsLink: {
      type: String,
      default: "https://www.onelyk.com",
    },
  },
  { timestamps: true },
);

/**
 * @typedef {import("mongoose").Model<ReviewsFlow>} ReviewsFlow
 * @typedef {typeof ReviewsFlow.schema.obj} ReviewsFlowType
 */
const ReviewsFlow = mongoose.model("ReviewsFlow", reviewsFlowSchema);

const CreateReviewsFlowValidationSchema = z.object({
  reviewsEnabled: z.boolean(),
  reviewsLink: z.string(),
  startLimitForReviewLink: z.number().optional(),
});

const UpdateReviewsFlowValidationSchema = z.object({
  reviewsEnabled: z.boolean().optional(),
  reviewsLink: z.string().optional(),
  startLimitForReviewLink: z.preprocess(
    (value) => (value !== undefined ? Number(value) : undefined),
    z.number().optional(),
  ),
});

ReviewsFlow.init().then(() => {
  logger.info("Initialized ReviewsFlow Model");
});
module.exports = {
  ReviewsFlow,
  CreateReviewsFlowValidationSchema,
  UpdateReviewsFlowValidationSchema,
};
