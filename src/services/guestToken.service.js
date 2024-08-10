const guestService = require("./guest.service");
const { GuestToken } = require("../models/guestToken.model");
const encryptionUtil = require("../utils/encrpytion.util");

/**
 * Create a guest token
 * @param {string} guestId - The guestId to create a token
 * @param {string} session 	- The mongoose session
 * @returns {Promise<string>} - The token
 */
const create = async (guestId, session) => {
	const token = crypto.randomUUID();
	// TODO: Maybe secure the token
	// const encryptedToken = encryptionUtil.encrypt(token);
	// const guest = await guestService.getByGuestId(guestId);
	const expiry = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days -- 15 * 24 * 60 * 60 * 1000
	const guestToken = new GuestToken({
		guestId: guestId,
		token: token,
		expiry: expiry,
	});
	await guestToken.save({ session });
	return token;
};

/**
 * Get a guest token by guestId
 * @param {string} guestId - The guestId to filter guest tokens
 * @returns {Promise<import('../models/guestToken.model').GuestTokenType>} - The guest token
 */
const getByGuestId = async (guestId) => {
	const guestToken = GuestToken.findOne({ guestId });
	return guestToken;
};

/**
 * Get a guest token by token
 * @param {string} token - The token to filter guest tokens
 * @returns {Promise<import('../models/guestToken.model').GuestTokenType>} - The guest token
 */
const getByToken = async (token) => {
	const guestToken = GuestToken.findOne({ token });
	return guestToken;
};

/**
 * Find a guest token by filters
 * @param {object} filters - The filters to find guest tokens
 * @returns {Promise<import('../models/guestToken.model').GuestTokenType>} - The guest token
 */
const find = async (filters) => {
	const guestToken = await GuestToken.findOne(filters);
	return guestToken;
};

/**
 * Delete a guest token by guestId
 * @param {string} guestId - The guestId to filter guest tokens
 * @returns {Promise<import('../models/guestToken.model').GuestTokenType>} - The guest token
 */
const deleteByGuestId = async (guestId) => {
	const guestToken = await GuestToken.findOneAndDelete({ guestId });
	return guestToken;
};

module.exports = {
	create,
	getByGuestId,
	getByToken,
	find,
	deleteByGuestId,
};
