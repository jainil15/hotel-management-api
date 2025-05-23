const houseKeepingService = require("../services/houseKeepingRequest.service");
const { default: mongoose } = require("mongoose");
const propertyService = require("../services/property.service");
const guestStatusService = require("../services/guestStatus.service");
const workflowService = require("../services/workflow.service");
const messageService = require("../services/message.service");
const chatListService = require("../services/chatList.service");
const asiPmsService = require("../services/asiPms.service");
const { ROOM_STATUS_CODE } = require("../constants/asi.constant");
const {
  houseKeepingRequestMailTemplate,
  sendMail,
} = require("../utils/mail.util");
const {
  ValidationError,
  APIError,
  InternalServerError,
  NotFoundError,
} = require("../lib/CustomErrors");
const {
  CreateHouseKeepingRequestValidationSchema,
  UpdateHouseKeepingRequestValidationSchema,
} = require("../models/houseKeepingRequest.model.js");
const { responseHandler } = require("../middlewares/response.middleware");
const guestService = require("../services/guest.service");
const { GUEST_CURRENT_STATUS } = require("../constants/guestStatus.contant");
const {
  messageType,
  messageTriggerType,
} = require("../constants/message.constant.js");

const create = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { propertyId, guestId } = req.guestSession;
    const request = req.body;
    const houseKeepingRequestResult =
      CreateHouseKeepingRequestValidationSchema.safeParse(request);
    if (!houseKeepingRequestResult.success) {
      throw new ValidationError("Validation Error", {
        ...houseKeepingRequestResult?.error?.flatten().fieldErrors,
      });
    }
    const property = await propertyService.getById(propertyId);
    if (!property.property) {
      throw new NotFoundError("Property not found", {});
    }

    // check if the house keeping option match the options in the workflow
    const workflow = await workflowService.getByPropertyId(propertyId);
    if (!workflow) {
      throw new NotFoundError("Workflow not found", {});
    }
    const houseKeepingOptions = workflow.addOnsFlow.houseKeepingAddOns.options;
    const houseKeepingOption = houseKeepingRequestResult.data.options;
    for (const option of houseKeepingOption) {
      if (!houseKeepingOptions.includes(option)) {
        throw new ValidationError("Invalid house keeping option", {});
      }
    }

    const guest = await guestService.getById(guestId, propertyId);
    if (!guest) {
      throw new NotFoundError("Guest not found", {});
    }
    // if (new Date(guest.checkOut) < new Date()) {
    //   throw new ValidationError("Guest has already checked out", {});
    // }
    // if (new Date(guest.checkIn) > new Date()) {
    //   throw new ValidationError("Guest has not checked in yet", {});
    // }
    const guestStatus = await guestStatusService.getByGuestId(guestId);
    if (guestStatus.currentStatus !== GUEST_CURRENT_STATUS.IN_HOUSE) {
      throw new ValidationError("Guest is not in house", {});
    }

    const newHouseKeepingRequest = await houseKeepingService.create(
      propertyId,
      guestId,
      houseKeepingRequestResult.data,
      session,
    );
    // TODO: Change house keeping status in pms
    console.log(property);
    if (property.property.pmsId) {
      const asiPmsResponse = await asiPmsService.changeRoomStatus(
        property.property.pmsId,
        "813D2A24-6B5D-463C-BA76-CB9369C8375F",
        "5T9OPcFv&jipS87^VaMfvsMLTghH209276Vcdg#mAP0^$",
        guest.roomNumber,
        ROOM_STATUS_CODE.IN_HOUSE_DIRTY,
      );
      console.log(asiPmsResponse);
    }
    const message = houseKeepingRequestMailTemplate(guest);
    sendMail(
      property.property.email,
      `Room - ${guest.roomNumber}, New Housekeeping Service Request Received`,
      message,
    );
    const newMessage = await messageService.create(
      {
        propertyId: propertyId,
        guestId: guestId,
        senderId: guestId,
        receiverId: propertyId,
        content: `House keeping request ${houseKeepingRequestResult.data.options !== 0 ? "(" : ""}${houseKeepingRequestResult.data.options.join(
          ", ",
        )}${houseKeepingRequestResult.data.options !== 0 ? ")" : ""} received`,
        messageType: messageType.REQUEST,
        messageTriggerType: messageTriggerType.AUTOMATIC,
        houseKeepingRequestId: newHouseKeepingRequest._id,
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

    req.app.io.to(`property:${propertyId}`).emit("chatList:update", {
      chatList: updatedChatList,
    });
    req.app.io.to(`property:${propertyId}`).emit("addOn:newAddon", {
      count: 1,
    });

    req.app.io.to(`guest:${guestId}`).emit("message:newMessage", {
      message: newMessage,
    });
    req.app.io.to(`property:${propertyId}`).emit("request:update", {});
    await session.commitTransaction();
    session.endSession();
    return responseHandler(res, newHouseKeepingRequest);
  } catch (e) {
    console.log(e);
    await session.abortTransaction();
    session.endSession();
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

const updateStatus = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { requestId } = req.params;
    const { requestStatus } = req.body;
    const houseKeepingRequestResult =
      UpdateHouseKeepingRequestValidationSchema.safeParse({ requestStatus });
    if (!houseKeepingRequestResult.success) {
      throw new ValidationError("Validation Error", {
        ...houseKeepingRequestResult?.error?.flatten().fieldErrors,
      });
    }

    const updatedHouseKeepingRequest = await houseKeepingService.update(
      requestId,
      { requestStatus },
    );
    const guest = await guestService.getById(
      updatedHouseKeepingRequest.guestId,
      updatedHouseKeepingRequest.propertyId,
    );
    if (!guest) {
      throw new NotFoundError("Guest not found", {});
    }
    if (new Date(guest.checkOut) < new Date()) {
      throw new ValidationError("Guest has already checked out", {});
    }
    req.app.io
      .to(`property:${updatedHouseKeepingRequest.propertyId}`)
      .emit("request:update", {});
    req.app.io.to(`property:${guest.propertyId}`).emit("addOn:newAddon", {
      count: 1,
    });
    await session.commitTransaction();
    session.endSession();
    return responseHandler(res, updatedHouseKeepingRequest);
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

const get = async (req, res, next) => {
  try {
    const { propertyId, guestId } = req.guestSession;
    const houseKeepingRequests = await houseKeepingService.getByGuestId(
      propertyId,
      guestId,
    );
    return responseHandler(res, houseKeepingRequests);
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

module.exports = {
  create,
  updateStatus,
  get,
};
