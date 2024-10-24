const { ReviewsFlow } = require("../models/reviewsFlow.model");

/**
 * Create a new ReviewsFlow
 * @param {string} propertyId - The property id
 * @param {import('../models/reviewsFlow.model').ReviewsFlowType} reviewFlow - The reviewFlow object
 * @param {object} session - The mongoose session
 * @returns {Promise<import('../models/reviewsFlow.model').ReviewsFlowType>} - The saved ReviewsFlow
 */
const create = async (propertyId, reviewFlow, session) => {
  const newReviewFlow = new ReviewsFlow({ ...reviewFlow, propertyId });
  const savedReviewFlow = await newReviewFlow.save({ session });
  return savedReviewFlow;
};

/**
 * Get ReviewsFlow by propertyId
 * @param {string} propertyId - The propertyId to filter ReviewsFlow
 * @returns {Promise<import('../models/reviewsFlow.model').ReviewFlowType>} - The ReviewsFlow
 */
const getByPropertyId = async (propertyId) => {
  const reviewFlow = await ReviewsFlow.findOne({ propertyId });
  return reviewFlow;
};

/**
 * Update ReviewsFlow
 * @param {string} propertyId - The propertyId to filter ReviewsFlow
 * @param {import('../models/reviewsFlow.model').ReviewsFlowType} reviewsFlow - The reviewFlow object
 * @returns {Promise<import('../models/reviewsFlow.model').ReviewsFlowType>} - The updated ReviewsFlow
 */
const update = async (propertyId, reviewFlow) => {
  const updatedReviewFlow = await ReviewsFlow.findOneAndUpdate(
    { propertyId },
    reviewFlow,
    {
      new: true, // Return the updated document
      upsert: true, // Create a new document if none is found
    },
  );
  return updatedReviewFlow;
};

/**
 * Remove ReviewsFlow by propertyId
 * @param {string} propertyId - The propertyId to filter ReviewsFlow
 * @returns {Promise<import('../models/reviewsFlow.model').ReviewsFlowType>} - The ReviewsFlow
 */
const remove = async (propertyId) => {
  const reviewFlow = await ReviewsFlow.findOneAndDelete({ propertyId });
  return reviewFlow;
};

module.exports = { create, getByPropertyId, update, remove };
