const { CheckInOutRequest } = require("../models/checkInOutRequest.model");

/**
 * Create a new check in/out request
 * @param {string} propertyId - The property id
 * @param {string} guestId - The guest id
 * @param {import('../models/checkInOutRequest.model').CheckInOutRequestType} checkInOutRequest - The status of the request
 * @param {object} session - The mongoose session
 * @returns {Promise<import('../models/checkInOutRequest.model').CheckInOutRequestType>} - The saved check in/out request
 */
const create = async (propertyId, guestId, checkInOutRequest, session) => {
	const newCheckInOutRequest = new CheckInOutRequest({
		propertyId: propertyId,
		guestId: guestId,
		...checkInOutRequest,
	});

	const savedCheckInOutRequest = await newCheckInOutRequest.save({ session });
	return savedCheckInOutRequest;
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
	return checkInOutRequest;
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
	checkInOutRequestStatus,
	session,
) => {
	const updatedCheckInOutRequest = await CheckInOutRequest.findOneAndUpdate(
		{
			propertyId: propertyId,
			_id: checkInOutRequestId,
		},

		checkInOutRequestStatus,

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

module.exports = {
	create,
	getByPropertyId,
	getByPropertyIdAndGuestId,
	findOne,
	updateRequestStatus,
	getByRequestType,
};
