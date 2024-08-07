const {
	UnauthorizedError,
	APIError,
	InternalServerError,
	NotFoundError,
} = require("../lib/CustomErrors");
const twilio = require("twilio");
const twilioAccountService = require("../services/twilioAccount.service");
require("dotenv").config();
/**
 * Twilio Auth Middleware
 * @param {import('express').Request} req - request object
 * @param {import('express').Response} res - response object
 * @param {import('express').NextFunction} next - next middleware
 * @returns {void}
 */
const twilioAuth = async (req, res, next) => {
	try {
		const twilioSignature = req.headers["x-twilio-signature"];

		const twilioAccount = await twilioAccountService.findOne({
			sid: req.body.AccountSid,
		});

		const valid = twilio.validateRequest(
			twilioAccount.authToken,
			twilioSignature,
			process.env.TWILIO_STATUS_CALLBACK,
			req.body,
		);

		if (!valid) {
			throw new UnauthorizedError("Unauthorized", {});
		}
		next();
	} catch (e) {
		if (e instanceof APIError) {
			return next(e);
		}
		return next(new InternalServerError(e.message));
	}
};

const twilioAuthV2 = async (req, res, next) => {
	try {
		const twilioSignature = req.headers["x-twilio-signature"];
		const twilioAccount = await twilioAccountService.findOne({
			sid: req.body.AccountSid,
		});

		if (!twilioAccount) {
			throw new NotFoundError("Twilio Account not found", {});
		}

		const valid = twilio.validateRequest(
			twilioAccount.authToken,
			twilioSignature,
			`${process.env.TWILIO_CALLBACK_URL}${req.originalUrl}`,
			req.body,
		);

		if (!valid) {
			throw new UnauthorizedError("Unauthorized", {});
		}
		next();
	} catch (e) {
		if (e instanceof APIError) {
			return next(e);
		}
		return next(new InternalServerError(e.message));
	}
};

module.exports = { twilioAuth, twilioAuthV2 };
