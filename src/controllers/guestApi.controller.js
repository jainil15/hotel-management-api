const { default: mongoose } = require("mongoose");
const {
  APIError,
  InternalServerError,
  ConflictError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
} = require("../lib/CustomErrors");
const { responseHandler } = require("../middlewares/response.middleware");
const guestService = require("../services/guest.service");
const reviewService = require("../services/review.service");
const addOnsRequestService = require("../services/addOnsRequest.service");
const propertyService = require("../services/property.service");
const workflowService = require("../services/workflow.service");
const setttingService = require("../services/setting.service");
const addOnsFlowService = require("../services/addOnsFlow.service");
const checkInOutRequestService = require("../services/checkInOutRequest.service");
const guestStatusService = require("../services/guestStatus.service");
const messageService = require("../services/message.service");
const chatListService = require("../services/chatList.service");
const preArrivalService = require("../services/preArrival.service");
const preArrivalFlowService = require("../services/preArrivalFlow.service");
const { PRE_ARRIVAL_STATUS } = require("../constants/guestStatus.contant");
const { ROLE } = require("../constants/role.constant");
const {
  validatePreArrivalFlow,
  zodValidatePreArrivalFlow,
} = require("../utils/preArrival.util");

const {
  CreateCheckInOutRequestValidationSchema,
} = require("../models/checkInOutRequest.model");
const { compareDateGt } = require("../utils/dateCompare");
const { REQUEST_STATUS } = require("../constants/guestStatus.contant");
const { validateUpdatev3 } = require("../utils/guestStatus.util");
const {
  messageType,
  requestType,
  messageTriggerType,
} = require("../constants/message.constant");
const {
  CreatePreArrivalValidationSchema,
} = require("../models/preArrival.model");
const { CreateReviewValidationSchema } = require("../models/review.model");
const {
  CreateAddOnsRequestValidationSchema,
} = require("../models/addOnsRequest.model");

/**
 * Get guest
 * @param {import('express').Request} req - Request object
 * @param {import('express').Response} res - Response object
 * @param {import('express').NextFunction} next - Next function
 * @returns {Promise<import('express').Response>} - Response object
 */
const getGuest = async (req, res, next) => {
  try {
    const guestId = req.guestSession.guestId;
    const propertyId = req.guestSession.propertyId;
    const guest = await guestService.getById(guestId, propertyId);
    return responseHandler(res, guest);
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

/**
 * Get workflow
 * @param {import('express').Request} req - Request object
 * @param {import('express').Response} res - Response object
 * @param {import('express').NextFunction} next - Next function
 * @returns {Promise<import('express').Response>} - Response object
 */
const getWorkflow = async (req, res, next) => {
  try {
    const propertyId = req.guestSession.propertyId;
    const workflow = await workflowService.getByPropertyId(propertyId);
    return responseHandler(res, workflow);
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

/**
 * Get property
 * @param {import('express').Request} req - Request object
 * @param {import('express').Response} res - Response object
 * @param {import('express').NextFunction} next - Next function
 * @returns {Promise<import('express').Response>} - Response object
 */
const getProperty = async (req, res, next) => {
  try {
    const propertyId = req.guestSession.propertyId;
    const property = await propertyService.getById(propertyId);
    return responseHandler(res, property);
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

/**
 * Get settings
 * @param {import('express').Request} req - Request object
 * @param {import('express').Response} res - Response object
 * @param {import('express').NextFunction} next - Next function
 * @returns {Promise<import('express').Response>} - Response object
 */
const getSettings = async (req, res, next) => {
  try {
    const { propertyId } = req.guestSession;
    const settings = await setttingService.getByPropertyId(propertyId);
    return responseHandler(res, settings);
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

/**
 * Create check in out request
 * @param {import('express').Request} req - Request object
 * @param {import('express').Response} res - Response object
 * @param {import('express').NextFunction} next - Next function
 * @returns {Promise<import('express').Response>} - Response object
 */
const createCheckInOutRequest = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { propertyId, guestId } = req.guestSession;
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
      {
        requestType: checkInOutRequest.requestType,
      },
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

    return responseHandler(res, {
      checkInOutRequest: newCheckInOutRequest,
    });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

/**
 * Get guest with status
 * @param {import('express').Request} req - Request object
 * @param {import('express').Response} res - Response object
 * @param {import('express').NextFunction} next - Next function
 * @returns {Promise<import('express').Response>} - Response object
 */
const getGuestWithStatus = async (req, res, next) => {
  try {
    const { propertyId, guestId } = req.guestSession;
    const guest = await guestService.getById(guestId, propertyId);
    const guestStatus = await guestStatusService.getByGuestId(guestId);
    return responseHandler(res, {
      ...guest._doc,
      status: guestStatus,
    });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

/**
 * Get guest status
 * @param {import('express').Request} req - Request object
 * @param {import('express').Response} res - Response object
 * @param {import('express').NextFunction} next - Next function
 * @returns {Promise<import('express').Response>} - Response object
 */
const getGuestStatus = async (req, res, next) => {
  try {
    const { guestId } = req.guestSession;

    const guestStatus = await guestStatusService.getByGuestId(guestId);
    return responseHandler(res, guestStatus);
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

/**
 * Create pre arrival
 * @param {import('express').Request} req - Request object
 * @param {import('express').Response} res - Response object
 * @param {import('express').NextFunction} next - Next function
 * @returns {Promise<import('express').Response>} - Response object
 */
const createPreArrival = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { propertyId, guestId } = req.guestSession;
    const preArrival = req.body;

    preArrival.consentToText = preArrival.consentToText === "true";
    preArrival.policyAccepted = preArrival.policyAccepted === "true";
    preArrival.guestSignature = req?.files?.guestSignature;
    preArrival.guestIdProof = req?.files?.guestIdProof;
    if (preArrival.consentToText === false) {
      throw new ValidationError("Input Validation Error", {
        consentToText: ["Consent to text is required"],
      });
    }
    if (preArrival.policyAccepted === false) {
      throw new ValidationError("Input Validation Error", {
        policyAccepted: ["Policy accepted is required"],
      });
    }
    const preArrivalResult =
      CreatePreArrivalValidationSchema.safeParse(preArrival);

    if (!preArrivalResult.success) {
      throw new ValidationError("Input Validation Error", {
        ...preArrivalResult.error.flatten().fieldErrors,
      });
    }
    const preArrivalFlow =
      await preArrivalFlowService.getByPropertyId(propertyId);
    const validationResult = zodValidatePreArrivalFlow(
      preArrivalFlow._doc,
      preArrival,
    );
    if (!validationResult.success) {
      throw new ValidationError("Validation Error", {
        ...validationResult.error.flatten().fieldErrors,
      });
    }
    const existingGuest = await guestService.getByGuestId(guestId);
    if (!existingGuest) {
      throw new ForbiddenError("Guest does not exist", {});
    }
    const existingPreArrival = await preArrivalService.getByGuestId(guestId);

    if (existingPreArrival) {
      throw new ConflictError("Pre arrival already exists", {});
    }

    const updatedGuestStatus = await guestStatusService.update(
      guestId,
      { preArrivalStatus: PRE_ARRIVAL_STATUS.APPLIED },
      session,
    );

    const newPreArrival = await preArrivalService.create(
      propertyId,
      guestId,
      preArrivalResult.data,
      session,
    );

    await session.commitTransaction();
    session.endSession();

    req.app.io.to(`property:${propertyId}`).emit("guestStatus:update", {
      guestStatus: updatedGuestStatus,
    });
    return responseHandler(res, { preArrival: newPreArrival });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

/**
 * Get check in out request
 * @param {import('express').Request} req - Request object
 * @param {import('express').Response} res - Response object
 * @param {import('express').NextFunction} next - Next function
 * @returns {Promise<import('express').Response>} - Response object
 */
const getCheckInOutRequest = async (req, res, next) => {
  try {
    const { propertyId, guestId } = req.guestSession;
    const checkInOutRequest =
      await checkInOutRequestService.getByPropertyIdAndGuestId(
        propertyId,
        guestId,
      );
    return responseHandler(res, checkInOutRequest);
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

/**
 * Create review
 * @param {import('express').Request} req - Request object
 * @param {import('express').Response} res - Response object
 * @param {import('express').NextFunction} next - Next function
 * @returns {Promise<import('express').Response>} - Response object
 */
const createReview = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { propertyId, guestId } = req.guestSession;
    const review = req.body;
    const reviewResult = CreateReviewValidationSchema.safeParse(review);
    if (!reviewResult.success) {
      throw new ValidationError(
        "Validation Error",
        reviewResult.error.flatten().fieldErrors,
      );
    }
    const createdReview = await reviewService.create(
      propertyId,
      guestId,
      review,
      session,
    );
    await session.commitTransaction();
    session.endSession();
    return responseHandler(
      res,
      { review: createdReview },
      201,
      "Review Created",
    );
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

const createAddOnsRequest = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { propertyId, guestId } = req.guestSession;
    const { name } = req.body;
    const addOnsRequest = await addOnsFlowService.findOneAddOn(
      propertyId,
      name,
    );
    if (!addOnsRequest) {
      throw new NotFoundError("Add Ons Request not found", {
        addOnsRequest: ["Add Ons Request not found"],
      });
    }
    const addOnsRequestResult =
      CreateAddOnsRequestValidationSchema.safeParse(addOnsRequest);
    if (!addOnsRequestResult.success) {
      throw new ValidationError(
        "Validation Error",
        addOnsRequestResult.error.flatten().fieldErrors,
      );
    }
    const createdAddOnsRequest = await addOnsRequestService.create(
      propertyId,
      guestId,
      addOnsRequestResult.data,
      session,
    );
    const newMessage = await messageService.create(
      {
        propertyId: propertyId,
        guestId: guestId,
        senderId: guestId,
        receiverId: propertyId,
        content: `Request for ${createdAddOnsRequest.name}`,
        messageType: messageType.ADDONS_REQUEST,
        messageTriggerType: messageTriggerType.AUTOMATIC,
        addOnsRequestId: createdAddOnsRequest._id,
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
    session.endSession();
    req.app.io.to(`property:${propertyId}`).emit("chatList:update", {
      chatList: updatedChatList,
    });
    req.app.io.to(`guest:${guestId}`).emit("message:newMessage", {
      message: newMessage,
    });
    return responseHandler(
      res,
      { addOnsRequest: createdAddOnsRequest },
      201,
      "Add Ons Request Created",
    );
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

const getAddOns = async (req, res, next) => {
  try {
    const { propertyId } = req.guestSession;
    const addOnsFlow = await addOnsFlowService.getByPropertyId(propertyId);
    return responseHandler(res, addOnsFlow);
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

module.exports = {
  getGuest,
  getWorkflow,
  getProperty,
  getAddOns,
  getSettings,
  getGuestWithStatus,
  getGuestStatus,
  createCheckInOutRequest,
  createPreArrival,
  getCheckInOutRequest,
  createReview,
  createAddOnsRequest,
};
