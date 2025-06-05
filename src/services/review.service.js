const { GuestStatus } = require("../models/guestStatus.model");
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
  const savedReview = await newReview.save({ session: session });
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

const getByPropertyId = async (propertyId) => {
  const review = await Review.find({
    propertyId,
  }).populate("guestId");

  const populatedReviews = await Promise.all(
    review.map(async (review) => {
      const guestStatus = await GuestStatus.findOne({
        guestId: review.guestId._id,
      });
      return {
        ...review.toObject(),
        guestStatus: guestStatus ? guestStatus.toObject() : null,
      };
    }),
  );

  return populatedReviews;
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
    { session: session, upsert: true, new: true },
  );
  return updatedReview;
};
const updateCompleteReview = async (
  propertyId,
  guestId,
  overAllRating,
  roomRating,
  service,
  location,
  comments,
  session,
) => {
  const updatedReview = await Review.findOneAndUpdate(
    { propertyId, guestId },
    { overAllRating, roomRating, service, location, comments },
    { session: session, upsert: true, new: true },
  );
  return updatedReview;
};

const getById = async (reviewId) => {
  const review = await Review.findOne({ _id: reviewId });
  if (!review) {
    throw new NotFoundError("Review not found", {
      reviewId: ["Review not found for the given id"],
    });
  }
  return review;
};

const getGoogleReviews = async (locationName,accessToken) => {};

module.exports = {
  create,
  getByGuestId,
  getByPropertyId,
  update,
  updateCompleteReview,
  getById
};
