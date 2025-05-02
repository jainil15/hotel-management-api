const { default: mongoose } = require("mongoose");
const { APIError, InternalServerError, ValidationError } = require("../lib/CustomErrors");
const { responseHandler } = require("../middlewares/response.middleware");
const { CreateReplyValidationSchema } = require("../models/reply.model");
const replyService = require("../services/reply.service");

/**
 * Create a new reply
 * @param {import('express').Request} req - Request
 * @param {import('express').Response} res - Response
 * @param {import('express').NextFunction} next - NextFunction
 * @returns {Promise<import('express').Response>} - Response
 */

const create = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { reviewId, guestId, ...reply } = req.body;
    const propertyId = req.params.propertyId;

    //Validate Reply
    const replyResult = CreateReplyValidationSchema.safeParse(reply);
    if (!replyResult.success) {
      throw new ValidationError(
        "Validation Error",
        replyResult.error.flatten().fieldErrors,
      );
    }

    const createdReply = await replyService.create(
      propertyId,
      guestId,
      reviewId,
      reply,
      session,
    );
    await session.commitTransaction();
    session.endSession();
    return responseHandler(res, { reply: createdReply }, 201, "Reply Created");
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};


module.exports = {
    create
}