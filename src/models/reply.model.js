const mongoose = require("mongoose");
const { z } = require("zod");
const logger = require("../configs/winston.config");
const Schema = mongoose.Schema;

const replySchema = new Schema({
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
  reviewId: {
    type: Schema.Types.ObjectId,
    ref: "Review",
    required: true,
    immutable: true,
  },
  reply: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now
  }
});

const CreateReplyValidationSchema = z.object({
  reply: z.string().min(1, "Reply cannot be empty").max(500),
});

/**
 * @typedef {import("mongoose").Model<Reply>} Reply
 * @typedef {typeof Reply.schema.obj} ReplyType
 */

const Reply = mongoose.model("Reply", replySchema);

Reply.init().then(() => {
  logger.info("Initialized Reply Model");
});

module.exports = {
  Reply,
  CreateReplyValidationSchema,
};
