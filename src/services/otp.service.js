const { NotFoundError } = require("../lib/CustomErrors");
const { Otp } = require("../models/otp.model");

const create = async (otp) => {
  const oldOtp = await getByEmail(otp.user.email);
  if (oldOtp) {
    await oldOtp.deleteOne();
  }
  const newOtp = new Otp(otp);
  const savedOtp = await newOtp.save();
  return savedOtp;
};
const getByEmail = async (email) => {
  const otp = await Otp.findOne({ "user.email": email });
  return otp;
};
const update = async (otp) => {
  const updatedOtp = await Otp.findByIdAndUpdate(otp._id, otp, { new: true });
  return updatedOtp;
};

const verify = async (email, otp) => {
  const newOtp = await Otp.findOne({ "user.email": email, otp });
  if (newOtp) {
    await newOtp.deleteOne();
  }
  return newOtp;
};

module.exports = { create, update, verify, getByEmail };
