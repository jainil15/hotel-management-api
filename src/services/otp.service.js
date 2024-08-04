const { NotFoundError } = require("../lib/CustomErrors");
const { Otp } = require("../models/otp.model");

/**
 * Create a new OTP
 * @param {object} otp - The OTP object
 * @returns {Promise<Otp>} - The saved OTP
 */
const create = async (otp, session) => {
	const oldOtp = await getByEmail(otp.user.email);
	if (oldOtp) {
		await oldOtp.deleteOne();
	}
	const newOtp = new Otp(otp);
	const savedOtp = await newOtp.save({ session });
	return savedOtp;
};

/**
 * Get OTP by email
 * @param {string} email - The email to filter OTP
 * @returns {Promise<Otp>} - The OTP
 */
const getByEmail = async (email) => {
	const otp = await Otp.findOne({ "user.email": email });
	return otp;
};

/**
 * Update an OTP
 * @param {Otp} otp - The OTP object
 * @returns {Promise<Otp>} - The updated OTP
 */
const update = async (otp) => {
	const updatedOtp = await Otp.findByIdAndUpdate(otp._id, otp, { new: true });
	return updatedOtp;
};

/**
 * Verify an OTP
 * @param {string} email - The email to filter OTP
 * @param {string} otp - The OTP
 * @returns {Promise<Otp>} - The verified OTP
 */
const verify = async (email, otp) => {
	const newOtp = await Otp.findOne({ "user.email": email, otp });
	if (newOtp) {
		await newOtp.deleteOne();
	}
	return newOtp;
};

module.exports = { create, update, verify, getByEmail };
