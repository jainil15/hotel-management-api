const { default: mongoose } = require("mongoose");
const {
  AddOnsRequest,
  CreateAddOnsRequestValidationSchema,
} = require("../models/addOnsRequest.model");

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
 * Get all Add Ons Requests by Guest Id
 * @param {string} propertyId
 * @param {string} guestId
 * @returns {Promise<Object>}
 */

// new ś
const findAllByGuestId = async (propertyId, guestId) => {
  const addOnsRequests = await AddOnsRequest.find({
    propertyId,
    guestId,
  });

  const statusCounts = addOnsRequests.reduce((acc, request) => {
    acc[request.requestStatus] = (acc[request.requestStatus] || 0) + 1;
    return acc;
  }, {});

  return { statusCounts, addOnsRequests };
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

/**
 * Update all Add Ons Requests by Guest Id
 * @param {string} propertyId
 * @param {string} guestId
 * @param {Object} updateData
 * @param {import('mongoose').ClientSession} session
 * @returns {Promise<Object>}
 */
// const updateAllByGuestId = async (propertyId, guestId, updateData, session) => {
//   console.log("updateAllByGuestId", propertyId, guestId, updateData);
//   const result = await AddOnsRequest.updateMany(
//     { propertyId, guestId },
//     { $set: updateData },
//     { session },
//   );
//   return result;
// };
const updateAllByGuestId = async (propertyId, guestId, updateData, session) => {
  console.log("updateAllByGuestId", propertyId, guestId, updateData); // Loop through each item in updateData and update each document individually
  const results = await Promise.all(
    updateData.map((item) => {
      const { _id, ...updateFields } = item; // Extract the _id and other fields to update
      return AddOnsRequest.updateOne(
        { propertyId, guestId, _id }, // Find document by propertyId, guestId, and _id
        { $set: updateFields }, // Update the document with remaining fields
        { session },
      );
    }),
  );

  return results;
};

module.exports = {
  create,
  update,
  getById,
  findAllByGuestId,
  getAllByPropertyId,
  updateAllByGuestId,
};
