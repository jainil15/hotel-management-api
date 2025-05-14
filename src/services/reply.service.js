const { InternalServerError } = require("../lib/CustomErrors");
const { Reply } = require("../models/reply.model");

/**
 * Create reply
 * @param {string} propertyId - propertyId
 * @param {string} guestId - guestId
 * @param {import('../models/reply.model').ReplyType} reply - reply object
 * @param {import('mongoose').ClientSession} session - session object
 * @returns {Promise<import('../models/reply.model').ReplyType>} - saved reply object
 */
const create = async (propertyId, guestId, reviewId, reply, session) => {
  const newReply = new Reply({
    propertyId,
    guestId,
    reviewId,
    ...reply,
  });
  const savedReply = await newReply.save({ session: session });
  return savedReply;
};

const getByPropertyId = async (propertyId) => {
  const allReplies = await Reply.find({ propertyId });
  return allReplies;
};

const getByReviewId = async (reviewId) => {
  const allReplies = await Reply.find({ reviewId });
  return allReplies;
};

module.exports = {
  create,
  getByPropertyId,
  getByReviewId,
};
