require("dotenv").config();
const nodemailerConfigOtptions = {
  host: "smtp.zoho.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_EMAIL_PASSWORD,
  },
};

module.exports = nodemailerConfigOtptions;
