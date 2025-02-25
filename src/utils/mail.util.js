const nodemailer = require("nodemailer");
const nodemailerConfigOptions = require("../configs/nodemailer.config");
const logger = require("../configs/winston.config");
require("dotenv").config();

/**
 * Send otp to user email
 * @param {string} to - The otp
 * @param {string} subject - The subject
 * @param {string} message - The message
 * @returns {Promise<object>} - The sent mail object
 */
const sendMail = async (to, subject, message) => {
  const time = new Date();

  const transporter = nodemailer.createTransport(nodemailerConfigOptions);
  const mail = {
    from: process.env.NODEMAILER_EMAIL,
    to: to,
    subject: subject,
    html: message,
  };
  const sentMail = await transporter.sendMail(mail);
  logger.info(`[${Date.now() - time}ms] Email sent`);
  return sentMail;
};

module.exports = {
  sendMail,
};
