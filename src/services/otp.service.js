const { Otp } = require("../models/otp.model");

const create = async (otp) => {
  try {
    const oldOtp = await getByEmail(otp.user.email);
    if (oldOtp) {
      await oldOtp.deleteOne();
    }
    const newOtp = new Otp(otp);
    const savedOtp = await newOtp.save();
    return savedOtp;
  } catch (e) {
    throw new Error("Error creating otp");
  }
};
const getByEmail = async (email) => {
  try {
    const otp = await Otp.findOne({ "user.email": email });
    return otp;
  }
  catch (e) {
    throw new Error("Error getting otp by email");
  }
}
const update = async (otp) => {
  try {
    const updatedOtp = await Otp.findByIdAndUpdate(otp._id, otp, { new: true });
    return updatedOtp;
  } catch (e) {
    throw new Error("Error updating otp" + e);
  }
};

const verify = async (email, otp) => {
  try {
    const newOtp = await Otp.findOne({ "user.email": email, otp });
    if (newOtp) {
      await newOtp.deleteOne();
    }
    return newOtp;
  } catch (e) {
    throw new Error("Error verifying otp");
  }
};

module.exports = { create, update, verify };
