const { default: mongoose } = require("mongoose");
const { z } = require("zod");
const logger = require("../configs/winston.config");
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: "Property",
    required: true,
    immutable: true,
  },
  guestId: {
    type: Schema.Types.ObjectId,
    ref: "Guest",
    required: true,
    immutable: true,
  },
  rating: {
    type: Number,
    required: true,
    enum: [1, 2, 3, 4, 5],
  },
});

const CreateReviewValidationSchema = z.object({
  rating: z.enum([1, 2, 3, 4, 5]),
});

/**
 * @typedef {import("mongoose").Model<Review>} Review
 * @typedef {typeof Review.schema.obj} ReviewType
 */
const Review = mongoose.model("Review", reviewSchema);

Review.init().then(() => {
  logger.info("Initialized Review Model");
});

module.exports = {
  Review,
  CreateReviewValidationSchema,
};
