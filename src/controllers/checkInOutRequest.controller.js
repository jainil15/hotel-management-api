const { default: mongoose } = require("mongoose");
const {
	ValidationError,
	APIError,
	InternalServerError,
	ConflictError,
	NotFoundError,
} = require("../lib/CustomErrors");
const {
	CreateCheckInOutRequestValidationSchema,
	UpdateRequestStatusValidationSchema,
} = require("../models/checkInOutRequest.model");
const messageService = require("../services/message.service");
const guestStatusService = require("../services/guestStatus.service");
const checkInOutRequestService = require("../services/checkInOutRequest.service");
const guestService = require("../services/guest.service");
const chatListService = require("../services/chatList.service");
const {
	LATE_CHECK_OUT_STATUS,
	GUEST_REQUEST,
	REQUEST_STATUS,
} = require("../constants/guestStatus.contant");
const {
	messageType,
	messageTriggerType,
	requestType,
} = require("../constants/message.constant");
const { responseHandler } = require("../middlewares/response.middleware");
const { compareDateGt } = require("../utils/dateCompare");
const { z } = require("zod");
const { validateUpdate, validateUpdatev3 } = require("../utils/guestStatus.util");

/**
 * Create check in out request
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
		const checkInOutRequest = req.body;
		const checkInOutRequestResult =
			CreateCheckInOutRequestValidationSchema.safeParse(checkInOutRequest);
		if (!checkInOutRequestResult.success) {
			throw new ValidationError(
				"Validation Error",
				checkInOutRequestResult.error.flatten().fieldErrors,
			);
		}
		const existingCheckInOutRequest = await checkInOutRequestService.findOne(
			propertyId,
			guestId,
			{ requestType: checkInOutRequest.requestType },
		);
		if (existingCheckInOutRequest) {
			throw new ConflictError("Similar request already exists", {
				checkInOutRequest: ["Similar request already exists"],
			});
		}
		const existingGuestStatus = await guestService.getById(guestId, propertyId);
		if (!existingGuestStatus) {
			throw new NotFoundError("Guest not found", {
				guest: ["Guest not found"],
			});
		}

		if (checkInOutRequest.requestType === "earlyCheckIn") {
			if (
				compareDateGt(
					new Date(checkInOutRequest.earlyCheckInDateTime),
					new Date(existingGuestStatus.checkIn),
				)
			) {
				throw new ValidationError("Invalid date", {
					earlyCheckInDateTime: [
						"Early check in date should be before the check In date",
					],
				});
			}
		} else if (checkInOutRequest.requestType === "lateCheckOut") {
			if (
				compareDateGt(
					new Date(existingGuestStatus.checkOut),
					new Date(checkInOutRequest.lateCheckOutDateTime),
				)
			) {
				throw new ValidationError("Invalid date", {
					date: ["Late check out date should be after the check out date"],
				});
			}
		} else {
			throw new ValidationError("Invalid request type", {
				requestType: ["Invalid request type"],
			});
		}
		const oldGuestStatus = await guestStatusService.getByGuestId(guestId);

		const updatedGuestStatus = await guestStatusService.update(
			guestId,
			{
				[`${checkInOutRequest.requestType}Status`]: REQUEST_STATUS.REQUESTED,
			},
			session,
		);

		if (!validateUpdatev3(oldGuestStatus._doc, updatedGuestStatus._doc)) {
			throw new ValidationError("Invalid Status", {
				currentStatus: ["Invalid Status"],
			});
		}

		const newCheckInOutRequest = await checkInOutRequestService.create(
			propertyId,
			guestId,
			checkInOutRequest,
			session,
		);

		const newMessage = await messageService.create(
			{
				propertyId: propertyId,
				guestId: guestId,
				senderId: guestId,
				receiverId: propertyId,
				content: `${requestType[checkInOutRequest.requestType]} Request`,
				messageType: messageType.REQUEST,
				messageTriggerType: messageTriggerType.AUTOMATIC,
				requestId: newCheckInOutRequest._id,
			},
			session,
		);

		const updatedChatList = await chatListService.updateAndIncUnreadMessages(
			propertyId,
			guestId,
			{
				latestMessage: newMessage._id,
			},
			session,
		);

		await session.commitTransaction();
		await session.endSession();

		req.app.io.to(`property:${propertyId}`).emit("chatList:update", {
			chatList: updatedChatList,
		});

		req.app.io.to(`guest:${guestId}`).emit("message:newMessage", {
			message: newMessage,
		});

		req.app.io.to(`property:${propertyId}`).emit("guest:guestStatusUpdate", {
			guestStatus: updatedGuestStatus,
		});

		return responseHandler(res, { checkInOutRequest: newCheckInOutRequest });
	} catch (e) {
		await session.abortTransaction();
		session.endSession();
		if (e instanceof APIError) {
			return next(e);
		}
		return next(new InternalServerError(e.message));
	}
};

const updateRequestStatus = async (req, res, next) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		const { propertyId, guestId, checkInOutRequestId } = req.params;
		const checkInOutRequest = req.body;

		const checkInOutRequestResult =
			UpdateRequestStatusValidationSchema.safeParse(checkInOutRequest);
		if (!checkInOutRequestResult.success) {
			throw new ValidationError(
				"Validation Error",
				checkInOutRequestResult.error.flatten().fieldErrors,
			);
		}

		const existingCheckInOutRequest = await checkInOutRequestService.findOne(
			propertyId,
			guestId,
			{ _id: checkInOutRequestId },
		);

		if (!existingCheckInOutRequest) {
			throw new NotFoundError("Request not found", {
				checkInOutRequestId: ["Request not found"],
			});
		}

		const existingGuestStatus = await guestService.getById(guestId, propertyId);
		if (!existingGuestStatus) {
			throw new NotFoundError("Guest not found", {
				guestId: ["Guest not found"],
			});
		}
		const updatedCheckInOutRequest =
			await checkInOutRequestService.updateRequestStatus(
				propertyId,
				checkInOutRequestId,
				checkInOutRequestResult.data,
				session,
			);
		const oldGuestStatus = await guestStatusService.getByGuestId(guestId);
		const updatedGuestStatus = await guestStatusService.update(
			guestId,
			{
				[`${updatedCheckInOutRequest.requestType}Status`]:
					checkInOutRequest.requestStatus,
			},
			session,
		);
		if (!validateUpdatev3(oldGuestStatus._doc, updatedGuestStatus._doc)) {
			throw new ValidationError("Invalid Status", {
				currentStatus: ["Invalid Status"],
			});
		}

		await session.commitTransaction();
		await session.endSession();

		req.app.io.to(`guest:${guestId}`).emit("message:newMessage", {});

		req.app.io.to(`property:${propertyId}`).emit("guest:guestStatusUpdate", {
			guestStatus: updatedGuestStatus,
		});

		return responseHandler(res, { checkInOutRequest: updatedCheckInOutRequest });
	} catch (e) {
		await session.abortTransaction();
		session.endSession();
		if (e instanceof APIError) {
			return next(e);
		}
		return next(new InternalServerError(e.message));
	}
};

const getAll = async (req, res, next) => {
	try {
		const { propertyId, guestId } = req.params;
		const checkInOutRequests =
			await checkInOutRequestService.getByPropertyIdAndGuestId(
				propertyId,
				guestId,
			);
		return responseHandler(res, { checkInOutRequests: checkInOutRequests });
	} catch (e) {
		if (e instanceof APIError) {
			return next(e);
		}
		return next(new InternalServerError(e.message));
	}
};

const getById = async (req, res, next) => {
	try {
		const { propertyId, guestId, checkInOutRequestId } = req.params;
		console.log(propertyId, guestId, checkInOutRequestId);
		const checkInOutRequest = await checkInOutRequestService.findOne(
			propertyId,
			guestId,
			{
				_id: checkInOutRequestId,
			},
		);

		return responseHandler(res, { checkInOutRequest: checkInOutRequest });
	} catch (e) {
		if (e instanceof APIError) {
			return next(e);
		}
		return next(new InternalServerError(e.message));
	}
};

/**
 * Get check in out request by status
 * @param {import('express').Request} req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {import('express').Response} - The response
 */
const getByRequestType = async (req, res, next) => {
	try {
		const { propertyId, guestId } = req.params;
		const { requestType } = req.query;
		const checkInOutRequests = await checkInOutRequestService.getByRequestType(
			propertyId,
			guestId,
			requestType,
		);
		return responseHandler(res, { checkInOutRequests: checkInOutRequests });
	} catch (e) {
		if (e instanceof APIError) {
			return next(e);
		}
		return next(new InternalServerError(e.message));
	}
};

module.exports = {
	create,
	updateRequestStatus,
	getAll,
	getById,
	getByRequestType,
};
