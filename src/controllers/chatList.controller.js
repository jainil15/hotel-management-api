const { default: mongoose } = require("mongoose");
const {
	APIError,
	InternalServerError,
	ValidationError,
} = require("../lib/CustomErrors");
const { responseHandler } = require("../middlewares/response.middleware");
const { UpdateChatListValidationSchema } = require("../models/chatList.model");
const chatListService = require("../services/chatList.service");
/**
 * Controller for getting all chat lists by property id
 * @param {import('express').Request} req - request object
 * @param {import('express').Response} res - response object
 * @param {import('express').NextFunction} next - next function
 * @returns {Promise<import('express').Response>} - response object
 */
const getAllByPropertyId = async (req, res, next) => {
	try {
		const propertyId = req.params.propertyId;
		const chatLists = await chatListService.getByPropertyId(propertyId);
		return responseHandler(res, chatLists);
	} catch (e) {
		if (e instanceof APIError) {
			return next(e);
		}
		return next(new InternalServerError(e.message));
	}
};

/**
 * Controller for updating chat list by property id and guest id
 * @param {import('express').Request} req - request object
 * @param {import('express').Response} res - response object
 * @param {import('express').NextFunction} next - next function
 * @returns {Promise<import('express').Response>} - response object
 */
const update = async (req, res, next) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		const propertyId = req.params.propertyId;
		const guestId = req.params.guestId;
		const chatList = req.body;
		const chatListResult = UpdateChatListValidationSchema.safeParse(chatList);
		if (!chatListResult.success) {
			throw new ValidationError("Validation Error", {
				...chatListResult.error.flatten().fieldErrors,
			});
		}
		const updatedChatList = await chatListService.update(
			propertyId,
			guestId,
			chatList,
			session,
		);
		await session.commitTransaction();
		session.endSession();
		req.app.io.to(`property:${propertyId}`).emit("chatList:update", {
			chatList: updatedChatList,
		});
		return responseHandler(res, { chatList: updatedChatList });
	} catch (e) {
		await session.abortTransaction();
		session.endSession();
		if (e instanceof APIError) {
			return next(e);
		}
		return next(new InternalServerError());
	}
};

/**
 * Temporary function for testing
 * Controller for creating chat list for a property and guest
 * @param {import('express').Request} req - request object
 * @param {import('express').Response} res - response object
 * @param {import('express').NextFunction} next - next function
 * @returns {Promise<import('express').Response>} - response object
 */

const create = async (req, res, next) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		const propertyId = req.params.propertyId;
		const guestId = req.params.guestId;
		const chatList = await chatListService.create(propertyId, guestId, session);
		await session.commitTransaction();
		session.endSession();
		return responseHandler(res, { chatList }, 201, "Chat List Created");
	} catch (e) {
		await session.abortTransaction();
		session.endSession();
		if (e instanceof APIError) {
			return next(e);
		}
		return next(new InternalServerError());
	}
};

/**
 * Controller delete chat list by property id and guest id
 * @param {import('express').Request} req - request object
 * @param {import('express').Response} res - response object
 * @param {import('express').NextFunction} next - next function
 * @returns {Promise<import('express').Response>} - response object
 */
const remove = async (req, res, next) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		const propertyId = req.params.propertyId;
		const guestId = req.params.guestId;
		const chatList = await chatListService.remove(propertyId, guestId, session);
		await session.commitTransaction();
		session.endSession();
		return responseHandler(res, { chatList });
	} catch (e) {
		await session.abortTransaction();
		session.endSession();
		if (e instanceof APIError) {
			return next(e);
		}
		return next(new InternalServerError());
	}
};

module.exports = { getAllByPropertyId, update, create, remove };
