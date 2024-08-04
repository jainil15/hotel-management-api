const logger = require("../configs/winston.config");
const { NotFoundError } = require("../lib/CustomErrors");
const { Guest } = require("../models/guest.model");
const { GuestStatus } = require("../models/guestStatus.model");

const create = async (guest, propertyId, session) => {
	try {
		const newGuest = new Guest({ ...guest, propertyId: propertyId });
		const savedGuest = await newGuest.save({ session });
		return savedGuest;
	} catch (e) {
		throw new Error("Error while creating guest");
	}
};

/**
 * Get all guests
 * @param {string} propertyId - property id
 * @returns {Promise<Guest>} guests - guests object
 */
const getAll = async (propertyId) => {
	const guests = await Guest.find({ propertyId: propertyId });
	return guests;
};

const getByGuestId = async (guestId) => {
	const guest = await Guest.findOne({ _id: guestId });
	if (!guest) {
		throw new NotFoundError("Guest not found", {
			guestId: ["Guest not found for the given id"],
		});
	}
	return guest;
};

/**
 * Get guest by id
 * @param {string} guestId - guest id
 * @param {string} propertyId - property id
 * @returns {object} guest - guest object
 */
const getById = async (guestId, propertyId) => {
	const guest = await Guest.findOne({ _id: guestId, propertyId: propertyId });
	if (!guest) {
		throw new NotFoundError("Guest not found", {
			guestId: ["Guest not found for the given id"],
		});
	}
	return guest;
};
/**
 * Update guest
 * @param {object} guest - guest object
 * @param {string} propertyId - property id
 * @param {string} guestId - guest id
 * @param {object} session - mongoose session
 * @returns {object} updatedGuest - updated guest object
 */
const update = async (guest, propertyId, guestId, session) => {
	const updatedGuest = await Guest.findOneAndUpdate(
		{ _id: guestId, propertyId: propertyId },
		{
			...guest,
			propertyId: propertyId,
		},
		{ session: session },
	);
	if (!updatedGuest) {
		throw new NotFoundError("Guest not found", {
			guestId: ["Guest not found for the given id"],
		});
	}
	return updatedGuest;
};

/**
 * Remove guest
 * @param {string} guestId - guest id
 * @param {string} propertyId - property id
 * @param {object} session - mongoose session
 * @returns {object} removedGuest - removed guest object
 */
const remove = async (guestId, propertyId, session) => {
	const removedGuest = await Guest.findOneAndDelete(
		{
			_id: guestId,
			propertyId: propertyId,
		},
		{ session: session },
	);
	if (!removedGuest) {
		throw new NotFoundError("Guest not found", {
			guestId: ["Guest not found for the given id"],
		});
	}
	return removedGuest;
};

/**
 * Get all guests with status
 * @param {string} propertyId - property id
 * @returns {object} guests - guests object
 */
const getAllGuestsWithStatus = async (propertyId) => {
	const guests = await GuestStatus.find({ propertyId: propertyId }).populate(
		"guestId",
	);

	return guests.map((guest) => {
		const { guestId, ...guestStatus } = { ...guest._doc };
		return {
			...guestId._doc,
			status: guestStatus,
		};
	});
};

/**
 * Get phone numbers of guests
 * @param {string[]} guestIds - guest ids
 * @returns {object} phoneNumbers - phone numbers object
 */
const getPhoneNumbers = async (guestIds) => {
	const phoneNumbers = await Guest.find(
		{ _id: { $in: guestIds } },
		{ phoneNumber: 1 },
	);
	return phoneNumbers;
};

/**
 * Find guest
 * @param {object} filter - filter object
 * @returns {object} guest - guest object
 */
const find = async (filter) => {
	const guest = await Guest.findOne(filter);
	return guest;
};

module.exports = {
	create,
	getAll,
	getById,
	update,
	remove,
	getAllGuestsWithStatus,
	getByGuestId,
	getPhoneNumbers,
	find,
};
