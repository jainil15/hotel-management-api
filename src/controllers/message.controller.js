// import { Request } from "express";
const messageService = require("../services/message.service");
const { MessagingResponse } = require("twilio").twiml;
const { ValidationError } = require("../lib/CustomErrors");
const { responseHandler } = require("../middlewares/response.middleware");
const { Guest } = require("../models/guest.model");
const { MessageValidationSchema, Message } = require("../models/message.model");
const { Property } = require("../models/property.model");
const { APIError, InternalServerError } = require("../lib/CustomErrors");

require("dotenv").config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);

//useless
const sendsms = async (req, res, next) => {
	try {
		const message = req.body;
		const result = MessageValidationSchema.safeParse(message);
		if (!result.success) {
			throw new ValidationError("Validation Error", {
				...result.error.flatten().fieldErrors,
			});
		}
		// TODO: Move code to service
		const guest = await Guest.findById(req.params.guestId);
		const property = await Property.findById(req.params.propertyId);
		// TODO: status callback to check if message was sent
		const sentMessage = await client.messages.create({
			body: result.data.content,
			from: property.countryCode + property.phoneNumber,
			to: guest.countryCode + guest.phoneNumber,
		});

		const newMessage = await Message.create({
			...result.data,
			propertyId: req.params.propertyId,
			guestId: req.params.guestId,
			senderId: req.params.propertyId,
			receiverId: req.params.guestId,
		});
		return responseHandler(res, { message: newMessage }, 200, "Message Sent");
	} catch (e) {
		if (e instanceof APIError) {
			return next(e);
		}
		return next(new InternalServerError());
	}
};

// useless
const incomingMessage = async (req, res, next) => {
	try {
		console.log(req.body);
		const twiml = new MessagingResponse();
		// TODO: Move code to service
		const property = await Property.findOne({
			phoneNumber: req.body.To.substring(req.body.To.length - 10),
		});
		const guest = await Guest.findOne({
			phoneNumber: req.body.From.substring(req.body.To.length - 10),
			propertyId: property._id,
		});

		
		const newMessage = new Message({
			guestId: guest._id,
			propertyId: property._id,
			senderId: property._id,
			receiverId: guest._id,
			content: req.body.Body,
			messageType: "incoming",
			messageTriggerType: 0,
			active: true,
		});
		const savedMessage = await newMessage.save();
		// twiml.message("Welcome to Onelyk \n https://www.onelyk.com");
		return res.status(200)
	} catch (e) {
		if (e instanceof APIError) {
			return next(e);
		}
		return next(new InternalServerError());
	}
};

// useless
const errorLogging = async (req, res, next) => {
	try {
		return res.status(200).json({ result: { message: "Error received" } });
	} catch (e) {
		return res
			.status(500)
			.json({ error: { server: `Internal Server Error ${e}` } });
	}
};

//useless
const status = async (req, res, next) => {
	try {
		return res.status(200).json({ result: { message: "Status received" } });
	} catch (e) {
		return res
			.status(500)
			.json({ error: { server: `Internal Server Error ${e}` } });
	}
};

/**
 * Controller for getting all messages by property id and guest id
 * @param {import('express').Request} req - request object
 * @param {import('express').Response} res - response object
 *@param {import('express').NextFunction} next - next function
 * @returns {Promise<import('express').Response>} - response object
 */
const getAll = async (req, res, next) => {
	try {
		const { propertyId, guestId } = req.params;
		const messages = await messageService.getAll(propertyId, guestId);
		return responseHandler(res, { messages: messages });
	} catch (e) {
		if (e instanceof APIError) {
			return next(e);
		}
		return next(new InternalServerError(e.message));
	}
};

module.exports = { sendsms, incomingMessage, errorLogging, status, getAll };
