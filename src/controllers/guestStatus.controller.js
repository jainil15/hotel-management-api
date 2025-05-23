const { default: mongoose } = require("mongoose");
const guestStatusService = require("../services/guestStatus.service");
const messageService = require("../services/message.service");
const chatListService = require("../services/chatList.service");
const checkInOutRequestService = require("../services/checkInOutRequest.service");
const {
	GuestStatusValidationSchema,
	UpdateGuestStatusValidationSchema,
	CreateGuestStatusValidationSchema,
} = require("../models/guestStatus.model");
const {
	ValidationError,
	InternalServerError,
	APIError,
	UnauthorizedError,
	NotFoundError,
} = require("../lib/CustomErrors");
const { responseHandler } = require("../middlewares/response.middleware");
const { validateStatusForGuest } = require("../utils/guestStatus.util");
const { z } = require("zod");
const { LATE_CHECK_OUT_STATUS } = require("../constants/guestStatus.contant");
const {
	messageTriggerType,
	messageType,
	requestType,
} = require("../constants/message.constant");

/**
 * Create guest status
 * @param {import('express').Request } req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {import('express').Response} - The response
 */
const create = async (req, res, next) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		const { propertyId, guestId } = req.params;
		const guestStatus = req.body;
		const result = CreateGuestStatusValidationSchema.safeParse({
			guestId,
			propertyId,
			...guestStatus,
		});
		if (!result.success) {
			throw new ValidationError(
				"Validation Error",
				result.error.flatten().fieldErrors,
			);
		}
		const savedGuestStatus = await guestStatusService.create(
			propertyId,
			guestId,
			guestStatus,
			session,
		);
		await session.commitTransaction();
		await session.endSession();
		return responseHandler(
			res,
			{ guestStatus: savedGuestStatus },
			201,
			"Guest Status Created",
		);
	} catch (e) {
		await session.abortTransaction();
		await session.endSession();
		if (e instanceof APIError) {
			return next(e);
		}
		return next(new InternalServerError());
	}
};

/**
 * Get guest status by guest id
 * @param {import('express').Request } req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {import('express').Response} - The response
 */
const getByGuestId = async (req, res, next) => {
	try {
		const { guestId } = req.params;
		const guestStatus = await guestStatusService.getByGuestId(guestId);
		if (!guestStatus) {
			return responseHandler(res, {}, 404, "Guest Status Not Found");
		}
		return responseHandler(res, { guestStatus }, 200, "Guest Status Found");
	} catch (e) {
		if (e instanceof APIError) {
			return next(e);
		}
		return next(new InternalServerError());
	}
};

/**
 * Update guest status by guest id
 * @param {import('express').Request } req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {import('express').Response} - The response
 */
const update = async (req, res, next) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		const { propertyId, guestId } = req.params;
		const guestStatus = req.body;

		const result = UpdateGuestStatusValidationSchema.safeParse({
			guestId,
			propertyId,
			...guestStatus,
		});
		if (!result.success) {
			throw new ValidationError(
				"Validation Error",
				result.error.flatten().fieldErrors,
			);
		}

		const updatedGuestStatus = await guestStatusService.update(
			guestId,
			guestStatus,
			session,
			req.user.role,
		);

		if (!updatedGuestStatus) {
			return responseHandler(res, {}, 404, "Guest Status Not Found");
		}

		req.app.io
			.to(`property:${updatedGuestStatus.propertyId}`)
			.emit("guest:guestStatusUpdate", { guestStatus: updatedGuestStatus });
		await session.commitTransaction();
		await session.endSession();
		return responseHandler(
			res,
			{ guestStatus: updatedGuestStatus },
			200,
			"Guest Status Updated",
		);
	} catch (e) {
		await session.abortTransaction();
		await session.endSession();
		if (e instanceof APIError) {
			return next(e);
		}
		return next(new InternalServerError(e.message));
	}
};

/**
 * Create check in out request by guestId
 * @param {import('express').Request } req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {import('express').Response} - The response
 */
const request = async (req, res, next) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		const { propertyId, guestId } = req.params;
		const { request, dateTime } = req.body;

		const requestResult = z
			.enum(["lateCheckOut", "earlyCheckIn"])
			.safeParse(request);
		if (!requestResult.success) {
			throw new ValidationError(
				"Validation Error",
				requestResult.error.flatten().fieldErrors,
			);
		}
		const updatedGuestStatus = await guestStatusService.update(
			guestId,
			{ [request]: LATE_CHECK_OUT_STATUS.REQUESTED },
			session,
			"guest",
		);

		if (!updatedGuestStatus) {
			throw new NotFoundError("Guest not found", {
				guestId: ["Guest not found"],
			});
		}
		const newCheckInOutRequest = await checkInOutRequestService.create(
			propertyId,
			guestId,
			{
				requestType: request,
				earlyCheckInDateTime: updatedGuestStatus.earlyCheckInDateTime,
				lateCheckOutDateTime: updatedGuestStatus.lateCheckOutDateTime,
			},
			session,
		);
		const newMessage = await messageService.create(
			{
				propertyId: propertyId,
				guestId: guestId,
				senderId: guestId,
				receiverId: propertyId,
				content: `Request for ${requestType[request]} has been made`,
				requestId: newCheckInOutRequest._id,
				messageTriggerType: messageTriggerType.AUTOMATIC,
				messageType: messageType.REQUEST,
				status: "delivered",
			},
			session,
		);

		const updatedChatList = await chatListService.updateAndIncUnreadMessages(
			propertyId,
			guestId,
			{ lastMessage: newMessage._id },
			session,
		);

		// Update the guest status
		req.app.io
			.to(`property:${propertyId}`)
			.emit("guest:guestStatusUpdate", { guestStatus: updatedGuestStatus });
		// Update chat list
		req.app.io.to(`property:${propertyId}`).emit("chatList:update", {
			chatList: updatedChatList,
		});
		// Update the message
		req.app.io
			.to(`guest:${guestId}`)
			.emit("message:newMessage", { message: newMessage });

		await session.commitTransaction();
		await session.endSession();

		return responseHandler(
			res,
			{ [request]: LATE_CHECK_OUT_STATUS.REQUESTED },
			200,
			"Request made successfully",
		);
	} catch (e) {
		await session.abortTransaction();
		await session.endSession();
		if (e instanceof APIError) {
			return next(e);
		}
		return next(new InternalServerError(e.message));
	}
};

module.exports = { create, getByGuestId, update, request };
