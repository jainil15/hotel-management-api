const { AddOnsRequest } = require("../models/addOnsRequest.model");

/**
 * Create Add Ons Request
 * @param {string} propertyId
 * @param {string} guestId
 * @param {import('../models/addOnsRequest.model').AddOnsRequestType} addOnsRequest
 * @param {import('mongoose').ClientSession} session
 * @returns {Promise<import('../models/addOnsRequest.model').AddOnsRequestType>}
 */
const create = async (propertyId, guestId, addOnsRequest, session) => {
  const newAddOnsRequest = new AddOnsRequest({
    propertyId,
    guestId,
    ...addOnsRequest,
  });
  const savedAddOnsRequest = await newAddOnsRequest.save({ session });
  return savedAddOnsRequest;
};

/**
 * Update Add Ons Request
 * @param {string} propertyId
 * @param {string} guestId
 * @param {import('../models/addOnsRequest.model').AddOnsRequestType} addOnsRequest
 * @param {import('mongoose').ClientSession} session
 * @returns {Promise<import('../models/addOnsRequest.model').AddOnsRequestType>}
 */
const update = async (
  propertyId,
  guestId,
  addOnsRequestId,
  addOnsRequest,
  session,
) => {
  const updatedAddOnsRequest = await AddOnsRequest.findOneAndUpdate(
    { propertyId, guestId, _id: addOnsRequestId },
    addOnsRequest,
    { new: true, session },
  );
  return updatedAddOnsRequest;
};

const getById = async (propertyId, guestId, addOnsRequestId) => {
  const addOnsRequest = await AddOnsRequest.findOne({
    propertyId,
    guestId,
    _id: addOnsRequestId,
  });
  return addOnsRequest;
};

module.exports = { create, update, getById };
