const { Reply } = require('../models/reply.model');

/**
 * Create reply
 * @param {string} propertyId - propertyId
 * @param {string} guestId - guestId
 * @param {import('../models/review.model').ReviewType} review - reply object
 * @param {import('mongoose').ClientSession} session - session object
 * @returns {Promise<import('../models/review.model').ReviewType>} - saved reply object
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


module.exports = {
    create
}