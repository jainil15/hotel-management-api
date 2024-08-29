const { default: mongoose } = require("mongoose");
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

/**
 * Get Add Ons Request by Id
 * @param {string} propertyId
 * @param {string} guestId
 * @param {string} addOnsRequestId
 * @returns {Promise<import('../models/addOnsRequest.model').AddOnsRequestType>}
 */
const getById = async (propertyId, guestId, addOnsRequestId) => {
  const addOnsRequest = await AddOnsRequest.findOne({
    propertyId,
    guestId,
    _id: addOnsRequestId,
  });
  return addOnsRequest;
};

/**
 * Get all Add Ons Request by Property Id
 * @param {string} propertyId - The property id
 * @param {string} requestStatus - The request status
 * @returns {Promise<import('../models/addOnsRequest.model').AddOnsRequestType[]>}
 */
const getAllByPropertyId = async (propertyId, requestStatus) => {
  const pipeline = [
    {
      $match: {
        propertyId: new mongoose.Types.ObjectId(propertyId),
        requestStatus: requestStatus,
      },
    },
    {
      $lookup: {
        from: "guests",
        localField: "guestId",
        foreignField: "_id",
        as: "guest",
      },
    },
    {
      $unwind: "$guest",
    },
  ];
  const addOnsRequests = await AddOnsRequest.aggregate(pipeline);
  return addOnsRequests;
};

module.exports = { create, update, getById, getAllByPropertyId };
