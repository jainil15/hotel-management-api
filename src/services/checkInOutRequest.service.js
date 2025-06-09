const { CheckInOutRequest } = require("../models/checkInOutRequest.model");
const { AddOnsFlow } = require("../models/addOnsFlow.model");
const { REQUEST_STATUS } = require("../constants/guestStatus.contant");
/**
 * Create a new check in/out request
 * @param {string} propertyId - The property id
 * @param {string} guestId - The guest id
 * @param {import('../models/checkInOutRequest.model').CheckInOutRequestType} checkInOutRequest - The status of the request
 * @param {object} session - The mongoose session
 * @returns {Promise<import('../models/checkInOutRequest.model').CheckInOutRequestType>} - The saved check in/out request
 */
// const create = async (
//   propertyId,
//   guestId,
//   checkInOutRequest,
//   checkInOutRequestId,
//   session,
// ) => {
//   const newCheckInOutRequest = new CheckInOutRequest({
//     propertyId: propertyId,
//     guestId: guestId,
//     checkInOutRequestId,
//     ...checkInOutRequest,
//   });

//   const savedCheckInOutRequest = await newCheckInOutRequest.save({ session });
//   return savedCheckInOutRequest;
// };
const create = async (
  propertyId,
  guestId,
  checkInOutRequest,
  checkInOutRequestId,
  session,
) => {
  // Check if a check-in/out request already exists with the same propertyId, guestId, and checkInOutRequestId
  const existingRequest = await CheckInOutRequest.findOne({
    propertyId,
    guestId,
    checkInOutRequestId,
  }).session(session);

  if (existingRequest) {
    // If it exists, update the existing request
    checkInOutRequest.requestStatus = "Requested";
    Object.assign(existingRequest, checkInOutRequest); // Merge new data into the existing request
    const updatedCheckInOutRequest = await existingRequest.save({ session });
    return updatedCheckInOutRequest; // Return the updated request
  } else {
    // If it doesn't exist, create a new request
    const newCheckInOutRequest = new CheckInOutRequest({
      propertyId,
      guestId,
      checkInOutRequestId,
      ...checkInOutRequest,
    });
    const savedCheckInOutRequest = await newCheckInOutRequest.save({ session });
    return savedCheckInOutRequest; // Return the newly created request
  }
};

/**
 * Get check in/out request by propertyId
 * @param {string} propertyId - The property id
 * @param {string} guestId - The guest id
 * @param {string} requestId - The request id
 * @returns {Promise<import('../models/checkInOutRequest.model').CheckInOutRequestType>} - The check in/out request
 */
const getByPropertyId = async (propertyId, guestId, requestId) => {
  const checkInOutRequest = await CheckInOutRequest.findOne({
    propertyId: propertyId,
    guestId: guestId,
    _id: requestId,
  });
  return checkInOutRequest;
};

/**
 * Get check in/out request by propertyId
 * @param {string} propertyId - The property id
 * @param {string} guestId - The guest id
 * @returns {Promise<import('../models/checkInOutRequest.model').CheckInOutRequestType[]>} - The check in/out request
 */
const getByPropertyIdAndGuestId = async (propertyId, guestId) => {
  const checkInOutRequest = await CheckInOutRequest.find({
    propertyId: propertyId,
    guestId: guestId,
  });
  if (checkInOutRequest.length == 0) {
    return [];
  }
  const addOnsFlow = await AddOnsFlow.findOne({ propertyId: propertyId });
  const result = checkInOutRequest.map((request) => {
    const checkInOutAddOn = addOnsFlow.checkInOutAddOns.find(
      (addon) =>
        addon._id.toString() === request.checkInOutRequestId?.toString(),
    );

    return {
      ...request.toObject(),
      addOnDetails: checkInOutAddOn || null, // Include the add-on details or null if not found
    };
  });

  return result;
};

/**
 * Find a check in/out request
 * @param {string} propertyId - The property id
 * @param {string} guestId - The guest id
 * @param {object} filter - The filter
 * @returns {Promise<import('../models/checkInOutRequest.model').CheckInOutRequestType>} - The check in/out request
 */
const findOne = async (propertyId, guestId, filter) => {
  const checkInOutRequest = await CheckInOutRequest.findOne({
    propertyId: propertyId,
    guestId: guestId,
    requestStatus: { $in: [REQUEST_STATUS.REQUESTED, REQUEST_STATUS.ACCEPTED] },
    ...filter,
  });
  return checkInOutRequest;
};

/**
 * Update check in/out request
 * @param {string} propertyId - The property id
 * @param {string} checkInOutRequestId - The check in/out request id
 * @param {import('../models/checkInOutRequest.model').CheckInOutRequestType} checkInOutRequestStatus - The status of the request
 * @param {object} session - The mongoose session
 *  @returns {Promise<import('../models/checkInOutRequest.model').CheckInOutRequestType>} - The updated check in/out request
 */
const updateRequestStatus = async (
  propertyId,
  checkInOutRequestId,
  checkInOutRequest,
  session,
) => {
  const updatedCheckInOutRequest = await CheckInOutRequest.findOneAndUpdate(
    {
      propertyId: propertyId,
      _id: checkInOutRequestId,
    },
    checkInOutRequest,
    {
      new: true,
      session: session,
    },
  );
  return updatedCheckInOutRequest;
};

/**
 * Get check in/out request by status
 * @param {string} propertyId - The property id
 * @param {string} guestId - The guest id
 * @param {import('../models/checkInOutRequest.model').CheckInOutRequestType} requestType - The status of the request
 * @returns {Promise<import('../models/checkInOutRequest.model').CheckInOutRequestType>} - The check in/out request
 */
const getByRequestType = async (propertyId, guestId, requestType) => {
  const checkInOutRequest = await CheckInOutRequest.findOne({
    propertyId: propertyId,
    guestId: guestId,
    requestType: requestType,
  });
  return checkInOutRequest;
};

/**
 * Update a field for all check-in/out requests by propertyId and guestId
 * @param {string} propertyId - The property id
 * @param {string} guestId - The guest id
 * @param {object} updateData - The data to update
 * @param {object} session - The mongoose session
 * @returns {Promise<import('../models/checkInOutRequest.model').CheckInOutRequestType[]>} - The updated check-in/out requests
 */
const updateFieldByPropertyIdAndGuestId = async (
  propertyId,
  guestId,
  updateDataArray,
  session,
) => {
  // Define the allowed fields based on the schema
  const allowedFields = [
    "requestStatus",
    "requestType",
    "earlyCheckInDateTime",
    "lateCheckOutDateTime",
    "extendStayDateTime",
  ];

  // Loop through each item in the updateData array
  for (const updateData of updateDataArray) {
    // Filter updateData to include only allowed fields
    delete updateData.addOnDetails;
    // const filteredUpdateData = Object.keys(updateData)
    //   .filter((key) => allowedFields.includes(key))
    //   .reduce((obj, key) => {
    //     obj[key] = updateData[key];
    //     return obj;
    //   }, {});

    // Perform the update on each matching document
    const result = await CheckInOutRequest.findByIdAndUpdate(
      updateData._id,
      updateData,
      { new: true },
    );
  }
};

const deleteCheckInOutRequest = async (
  propertyId,
  guestId,
  requestId,
  session,
) => {
  const deletedCheckInOutRequest = await CheckInOutRequest.findOneAndDelete({
    propertyId: propertyId,
    guestId: guestId,
    _id: requestId,
  }).session(session);

  return deletedCheckInOutRequest;
};
const closeCheckInOutRequest = async (
  propertyId,
  guestId,
  requestId,
  session,
) => {
  const updatedCheckInOutRequest = await CheckInOutRequest.findOneAndUpdate(
    {
      propertyId: propertyId,
      guestId: guestId,
      _id: requestId,
    },
    { requestStatus: REQUEST_STATUS.CLOSED },
    { new: true, session: session },
  );
  return updatedCheckInOutRequest;
};
module.exports = {
  create,
  getByPropertyId,
  getByPropertyIdAndGuestId,
  findOne,
  updateRequestStatus,
  getByRequestType,
  updateFieldByPropertyIdAndGuestId,
  deleteCheckInOutRequest,
  closeCheckInOutRequest,
};
