const { Review } = require("../models/review.model");

/**
 * Create review
 * @param {string} propertyId - propertyId
 * @param {string} guestId - guestId
 * @param {import('../models/review.model').ReviewType} review - review object
 * @param {import('mongoose').ClientSession} session - session object
 * @returns {Promise<import('../models/review.model').ReviewType>} - saved review object
 */
const create = async (propertyId, guestId, review, session) => {
  const newReview = new Review({
    propertyId,
    guestId,
    ...review,
  });
  const savedReview = await newReview({ session: session });
  return savedReview;
};

/**
 * Get review by guestId and propertyId
 * @param {string} propertyId - propertyId
 * @param {string} guestId - guestId
 * @returns {Promise<import('../models/review.model').ReviewType>} - review
 */
const getByGuestId = async (propertyId, guestId) => {
  const review = await Review.findOne({
    propertyId,
    guestId,
  });
  return review;
};

/**
 * Update guest review
 * @param {string} propertyId - propertyId
 * @param {string} guestId - guestId
 * @param {import('../models/review.model').ReviewType} review - review
 * @param {import('mongoose').ClientSession} session - session
 * @returns {Promise<import('../models/review.model').ReviewType>} - updated review
 */
const update = async (propertyId, guestId, review, session) => {
  const updatedReview = await Review.findOneAndUpdate(
    { propertyId, guestId },
    { ...review },
    { session: session },
  );
  return updatedReview;
};

module.exports = {
  create,
  getByGuestId,
  update,
};
