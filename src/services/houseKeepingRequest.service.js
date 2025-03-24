const { REQUEST_STATUS } = require("../constants/guestStatus.contant.js");
const { HouseKeepingRequest } = require("../models/houseKeepingRequest.model");

/**
 * Create a new houseKeeping request
 * @param {string} propertyId
 * @param {string} guestId
 * @param {Object} request
 * @param {import("mongoose").ClientSession} session
 * @returns {Promise<import("../models/houseKeepingRequest.model.js").HouseKeepingRequestType>}
 * @throws {Error}
 */
const create = async (propertyId, guestId, request, session) => {
  const newHouseKeepingRequest = new HouseKeepingRequest({
    propertyId: propertyId,
    guestId: guestId,
    name: request.name,
    description: request.description,
    requestStatus: REQUEST_STATUS.REQUESTED,
    options: request.options,
  });
  const savedHouseKeepingRequest = await newHouseKeepingRequest.save({
    session,
  });
  return savedHouseKeepingRequest;
};

/**
 * Find houseKeeping request by propertyId
 * @param {string} propertyId
 * @returns {Promise<import("../models/houseKeepingRequest.model.js").HouseKeepingRequestType[]>}
 * @throws {Error}
 */
const findByPropertyId = async (propertyId) => {
  const houseKeepingRequest = await HouseKeepingRequest.find({ propertyId });
  return houseKeepingRequest;
};

/**
 * Update houseKeeping request
 * @param {string} requestId
 * @param {Object} updateData
 * @param {import("mongoose").ClientSession} session
 * @returns {Promise<import("../models/houseKeepingRequest.model.js").HouseKeepingRequestType>}
 */
const update = async (requestId, updateData, session) => {
  const updatedHouseKeepingRequest =
    await HouseKeepingRequest.findByIdAndUpdate(requestId, updateData, {
      new: true,
      session,
    });
  return updatedHouseKeepingRequest;
};

/**
 * Get all houseKeeping requests by Guest Id
 * @param {string} propertyId
 * @param {string} guestId
 * @returns {Promise<Object>}
 */
const getByGuestId = async (propertyId, guestId) => {
  const houseKeepingRequests = await HouseKeepingRequest.find({
    propertyId,
    guestId,
  });
  return houseKeepingRequests;
};

module.exports = {
  create,
  findByPropertyId,
  update,
  getByGuestId,
};
