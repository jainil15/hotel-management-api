const nodemailer = require("nodemailer");
const nodemailerConfigOptions = require("../configs/nodemailer.config");
const logger = require("../configs/winston.config");
require("dotenv").config();

const failedMessageTemplate = (propertyId, twilioAccountId, from, to) => {
  return `
<html>
<body style="font-family: Helvetica, Arial, sans-serif; margin: 0px; padding: 0px; background-color: #ffffff;">
  <table role="presentation" style="width: 100%; height: 100%; border: 0; cellpadding: 0; cellspacing: 0; background-color: #ffffff;">
    <tr>
      <td align="center" style="padding: 0; margin: 0;">
        <table role="presentation" style="width: 600px; border: 0; cellpadding: 0; cellspacing: 0; color: #424242;">
          <tr>
            <td style="font-size: xx-large; padding: 10px;">
              Onelyk
            </td>
          </tr>
          <tr>
            <td style="font-size: x-large; padding: 10px; color:red">
              Failed to send message
            </td>
          </tr>
          <tr>
            <td style="font-size: large; padding: 10px;">
              From: ${from}
            </td>
          </tr>
          <tr>
            <td style="font-size: large; padding: 10px;">
              To: ${to}
            </td>
          </tr>
          <tr>
            <td style="font-size: large; padding: 10px;">
              Property ID: ${propertyId}
            </td>
          </tr>
          <tr>
            <td style="font-size: large; padding: 10px;">
              Twilio Account ID: ${twilioAccountId}
            </td>
          </tr>
          <tr>
            <td style="font-weight: lighter; color: #828282; font-size: small; padding: 5px;">
              Onelyk, California, US
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};
/**
 * Generate email template
 * @param {import('../models/guest.model.js').GuestType} guest - The guest object
 * @returns {string} - The email template
 */
const houseKeepingRequestMailTemplate = (guest) => {
  return `
<html>
<body style="font-family: Helvetica, Arial, sans-serif; margin: 0px; padding: 0px; background-color: #ffffff;">
  <table role="presentation" style="width: 100%; height: 100%; border: 0; cellpadding: 0; cellspacing: 0; background-color: #ffffff;">
    <tr>
      <td align="center" style="padding: 0; margin: 0;">
        <table role="presentation" style="width: 600px; border: 0; cellpadding: 0; cellspacing: 0; color: #424242;">
          <tr>
            <td style="font-size: xx-large; padding: 10px;">
              Onelyk
            </td>
          </tr>
          <tr>
            <td style="font-size: x-large; padding: 10px;">
              Housekeeping Request
            </td>
          </tr>
          <tr>
            <td style="font-size: large; padding: 10px;">
              ${guest.firstName} ${guest.lastName} has requested housekeeping service
            </td>
          </tr>
          <tr>
            <td style="font-size: large; padding: 10px;">
              Guest RoomNo: ${guest?.roomNumber}
            </td>
          </tr>
          <tr>
            <td style="font-weight: lighter; color: #828282; font-size: small; padding: 5px;">
              Onelyk, California, US
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`;
};
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
  failedMessageTemplate,
  houseKeepingRequestMailTemplate,
};
