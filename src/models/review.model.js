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
    enum: [0, 1, 2, 3, 4, 5],
    default: 0,
  },
  roomRating: {
    type: Number,
    required: true,
    enum: [0, 1, 2, 3, 4, 5],
    default: 0,
  },
  service: {
    type: Number,
    required: true,
    enum: [0, 1, 2, 3, 4, 5],
    default: 0,
  },
  location: {
    type: Number,
    required: true,
    enum: [0, 1, 2, 3, 4, 5],
    default: 0,
  },
  overAllRating: {
    type: Number,
    required: true,
    default: 0,
  },
  comments: {
    type: String,
    default: "",
    trim: true,
    maxlength: 500,
  },
});

const CreateReviewValidationSchema = z.object({
  rating: z.enum([1, 2, 3, 4, 5]),
  roomRating: z.enum([1, 2, 3, 4, 5]),
  service: z.enum([1, 2, 3, 4, 5]),
  location: z.enum([1, 2, 3, 4, 5]),
  overAllRating: z.enum([1, 2, 3, 4, 5]),
  comments: z.string().max(500).optional(),
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
