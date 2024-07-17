const nodemailer = require("nodemailer");
const nodemailerConfigOtptions = require("../configs/nodemailer.config");
require("dotenv").config();

const sendOtp = async (email, otp) => {
  // send otp to user email
  const transporter = nodemailer.createTransport(nodemailerConfigOtptions);
  const mail = {
    from: process.env.NODEMAILER_EMAIL,
    to: email,
    subject: "OTP for email verification",
    text: "Your otp is: " + otp,
  };
  const sentMail = await transporter.sendMail(mail);
  return sentMail;
};

module.exports = sendOtp;
