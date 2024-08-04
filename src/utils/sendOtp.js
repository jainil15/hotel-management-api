const nodemailer = require("nodemailer");
const nodemailerConfigOptions = require("../configs/nodemailer.config");
const logger = require("../configs/winston.config");
require("dotenv").config();

/**
 * Generate email template
 * @param {string} otp - The otp
 * @returns {string} - The email template
 */
const generateTemplate = (otp) => {
	return `
<html>
<body style="font-family: Helvetica, Arial, sans-serif; margin: 0px; padding: 0px; background-color: #ffffff;">
  <table role="presentation" style="width: 100%; height: 100%; border: 0; cellpadding: 0; cellspacing: 0; background-color: #ffffff;">
    <tr>
      <td align="center" style="padding: 0; margin: 0;">
        <table role="presentation" style="width: 600px; border: 0; cellpadding: 0; cellspacing: 0; text-align: center; color: #424242;">
          <tr>
            <td style="font-size: xx-large; padding: 20px;">
              Onelyk
            </td>
          </tr>
          <tr>
            <td style="font-size: x-large; padding: 10px;">
              Your one time verification code is
            </td>
          </tr>
          <tr>
            <td style="font-size: xxx-large; letter-spacing: 0.6em; font-weight: bolder; padding: 10px;">
              ${otp}
            </td>
          </tr>
          <tr>
            <td style="font-weight: lighter; color: #828282; font-size: small; padding: 5px;">
              This code will expire in 10 minutes
            </td>
          </tr>
          <tr>
            <td style="font-weight: lighter; color: #828282; font-size: small; padding: 5px;">
              Onelyk, 30 some street, California, US
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
 * Send otp to user email
 * @param {string} email - The email
 * @param {string} otp - The otp
 * @returns {Promise<object>} - The sent mail object
 */
const sendOtp = async (email, otp) => {
	const time = new Date();
	// send otp to user email

	const transporter = nodemailer.createTransport(nodemailerConfigOptions);
	const mail = {
		from: process.env.NODEMAILER_EMAIL,
		to: email,
		subject: "OTP for email verification",
		html: generateTemplate(otp),
	};
	const sentMail = await transporter.sendMail(mail);
	logger.info(`[${Date.now() - time}ms] Email sent`);
	return sentMail;
};

module.exports = sendOtp;
