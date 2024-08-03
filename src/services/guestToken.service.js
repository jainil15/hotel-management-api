const guestService = require("./guest.service");
const { GuestToken } = require("../models/guestToken.model");
const encryptionUtil = require("../utils/encrpytion.util");

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

const getByGuestId = async (guestId) => {
	const guestToken = GuestToken.findOne({ guestId });
	return guestToken;
};

const getByToken = async (token) => {
	const guestToken = GuestToken.findOne({ token });
	return guestToken;
};

const find = async (filters) => {
	const guestToken = await GuestToken.findOne(filters);
	return guestToken;
};

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
