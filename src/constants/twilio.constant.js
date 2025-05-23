require("dotenv").config();
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

module.exports = {
	TWILIO_ACCOUNT_SID,
	TWILIO_AUTH_TOKEN,
};
