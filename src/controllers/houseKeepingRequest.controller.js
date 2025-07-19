const houseKeepingService = require("../services/houseKeepingRequest.service");
const { default: mongoose } = require("mongoose");
const propertyService = require("../services/property.service");
const guestStatusService = require("../services/guestStatus.service");
const workflowService = require("../services/workflow.service");
const messageService = require("../services/message.service");
const chatListService = require("../services/chatList.service");
const asiPmsService = require("../services/asiPms.service");
const twilioAccountService = require("../services/twilioAccount.service");
const twilioService = require("../services/twilio.service");
const messageTemplateService = require("../services/messageTemplate.service");
const smsService = require("../services/sms.service");
const settingService = require("../services/setting.service");
const houseKeepingUtil = require("../utils/houseKeeping.util");
const hotelKeyPmsService = require("../services/hotelKeyPms.service");
const { ROOM_STATUS_CODE } = require("../constants/asi.constant");
const {
  houseKeepingRequestMailTemplate,
  sendMail,
} = require("../utils/mail.util");
const { addOnStatusUpdateEmail } = require("../utils/addOnEmailTemplate");
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
const {
  GUEST_CURRENT_STATUS,
  REQUEST_STATUS,
} = require("../constants/guestStatus.contant");
const {
  messageType,
  messageTriggerType,
} = require("../constants/message.constant.js");
const {
  HOUSE_KEEPING_REQUEST_TYPE,
} = require("../constants/housekeeping.contant.js");
const {
  modifyAddOnsMessageTemplateBody,
} = require("../utils/messageTemplateUpdate.js");
const { ADD_ONS_STATUS } = require("../constants/addOns.constant.js");
const { PMS_TYPE } = require("../constants/setting.constant");

const create = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { propertyId, guestId } = req.guestSession;
    const request = req.body;
    const validationResult =
      CreateHouseKeepingRequestValidationSchema.safeParse(request);
    if (!validationResult.success) {
      throw new ValidationError("Validation Error", {
        ...validationResult?.error?.flatten().fieldErrors,
      });
    }
    const property = await propertyService.getById(propertyId);
    if (!property.property) {
      throw new NotFoundError("Property not found", {});
    }
    console.log("Received request body:", request);
    const type = (request.type || request.requestType || "houseKeeping").trim();
    console.log("Type resolved in backend:", type);
    const workflow = await workflowService.getByPropertyId(propertyId);
    if (!workflow) {
      throw new NotFoundError("Workflow not found", {});
    }
    let validOptions = [];
    if (type === "houseKeeping") {
      validOptions = workflow.addOnsFlow.houseKeepingAddOns.options;
    } else if (type === "upgradeRoom") {
      validOptions = workflow.addOnsFlow.upgradeRoom?.options || [];
    } else {
      throw new ValidationError("Invalid add-on type", {});
    }
    if (
      type === HOUSE_KEEPING_REQUEST_TYPE.HOUSE_KEEPING &&
      !houseKeepingUtil.checkOptions(
        validationResult.data.options,
        validOptions,
      )
    ) {
      throw new ValidationError("Invalid options provided", {
        validOptions: validOptions,
      });
    }
    const requestOptions = validationResult.data.options;
    const guest = await guestService.getById(guestId, propertyId);
    if (!guest) {
      throw new NotFoundError("Guest not found", {});
    }
    const guestStatus = await guestStatusService.getByGuestId(guestId);
    if (guestStatus.currentStatus !== GUEST_CURRENT_STATUS.IN_HOUSE) {
      throw new ValidationError("Guest is not in house", {});
    }
    // Store the type in the created request
    const newHouseKeepingRequest = await houseKeepingService.create(
      propertyId,
      guestId,
      { ...validationResult.data, requestType: type },
      session,
    );
    // Only update PMS if this is a house keeping request
    if (type === "houseKeeping") {
      // Extract room number from guest (or from options if needed)
      const roomNumber = guest.roomNumber;
      const propertySetting = await settingService.getByPropertyId(propertyId);
      await sendPmsRequest(property, guest, propertySetting, roomNumber);
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
        content: `House keeping request ${validationResult.data.options !== 0 ? "(" : ""}${validationResult.data.options.join(
          ", ",
        )}${validationResult.data.options !== 0 ? ")" : ""} received`,
        messageType: messageType.REQUEST,
        messageTriggerType: messageTriggerType.AUTOMATIC,
        houseKeepingRequestId: newHouseKeepingRequest._id,
      },
      session,
    );
    if (guest.phoneNumber && guest.countryCode) {
      const twilioAccount =
        await twilioAccountService.getByPropertyId(propertyId);
      const twilioSubClient =
        await twilioService.getTwilioClient(twilioAccount);
      const messageTemplate =
        await messageTemplateService.getMessageTemplateByStatus(
          propertyId,
          `AddOns ${ADD_ONS_STATUS.REQUESTED}`,
        );
      const { property } = await propertyService.getById(propertyId);
      const messageBody = modifyAddOnsMessageTemplateBody(
        messageTemplate,
        property,
        guest,
        { name: "House Keeping" },
        "",
      );

      const sentSms = await smsService.send(
        twilioSubClient,
        `${twilioAccount.countryCode}${twilioAccount.phoneNumber}`,
        `${guest.countryCode}${guest.phoneNumber}`,
        // `Your request for ${existingAddOnsRequest.name} addon is ${requestStatus.toLowerCase()}`,
        messageBody.message,
      );
      // Create the new message
      const newMessage = await messageService.create(
        {
          propertyId,
          guestId,
          senderId: propertyId,
          receiverId: guestId,
          content: messageBody.message,
          messageTriggerType: messageTriggerType.AUTOMATIC,
          messageType: messageType.SMS,
          messageSid: sentSms.sid,
        },
        session,
      );
      if (guest.email) {
        sendMail(
          guest.email,
          "Add Ons House keeping request",
          messageBody.message,
        );
      }
    }
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
    const { requestId, propertyId, guestId } = req.params;
    const { requestStatus, reason } = req.body;
    const houseKeepingRequestResult =
      UpdateHouseKeepingRequestValidationSchema.safeParse({ requestStatus });
    if (!houseKeepingRequestResult.success) {
      throw new ValidationError("Validation Error", {
        ...houseKeepingRequestResult?.error?.flatten().fieldErrors,
      });
    }

    const updatePayload =
      requestStatus === REQUEST_STATUS.DECLINED
        ? { requestStatus, reason }
        : { requestStatus };

    const updatedHouseKeepingRequest = await houseKeepingService.update(
      requestId,
      { updatePayload },
    );
    const guest = await guestService.getById(
      updatedHouseKeepingRequest.guestId,
      updatedHouseKeepingRequest.propertyId,
    );
    const { property } = await propertyService.getById(propertyId);
    const mailTemplate = addOnStatusUpdateEmail(
      `${guest.firstName} ${guest.lastName}`,
      "House Keeping",
      requestStatus,
      property.name,
    );
    sendMail(
      property.email,
      `House Keeping Request ${requestStatus}`,
      mailTemplate,
    );
    if (!guest) {
      throw new NotFoundError("Guest not found", {});
    }
    if (new Date(guest.checkOut) < new Date()) {
      throw new ValidationError("Guest has already checked out", {});
    }
    if (guest.phoneNumber && guest.countryCode) {
      const twilioAccount =
        await twilioAccountService.getByPropertyId(propertyId);
      const twilioSubClient =
        await twilioService.getTwilioClient(twilioAccount);
      console.log(requestStatus);
      const messageTemplate =
        await messageTemplateService.getMessageTemplateByStatus(
          propertyId,
          `AddOns ${
            requestStatus === REQUEST_STATUS.ACCEPTED
              ? REQUEST_STATUS.ACCEPTED
              : "Rejected"
          }`,
        );
      if (!messageTemplate) {
        throw new NotFoundError("Message template not found", {});
      }
      if (messageTemplate) {
        const { property } = await propertyService.getById(propertyId);
        const messageBody = modifyAddOnsMessageTemplateBody(
          messageTemplate,
          property,
          guest,
          { name: "House Keeping" },
          reason || "",
        );

        const sentSms = await smsService.send(
          twilioSubClient,
          `${twilioAccount.countryCode}${twilioAccount.phoneNumber}`,
          `${guest.countryCode}${guest.phoneNumber}`,
          // `Your request for ${existingAddOnsRequest.name} addon is ${requestStatus.toLowerCase()}`,
          messageBody.message,
        );
        // Create the new message
        const newMessage = await messageService.create(
          {
            propertyId,
            guestId,
            senderId: propertyId,
            receiverId: guestId,
            content: messageBody.message,
            messageTriggerType: messageTriggerType.AUTOMATIC,
            messageType: messageType.SMS,
            messageSid: sentSms.sid,
          },
          session,
        );
        if (guest.email) {
          sendMail(
            guest.email,
            "Add Ons House keeping request",
            messageBody.message,
          );
        }
        const updatedChatList =
          await chatListService.updateAndIncUnreadMessages(
            propertyId,
            guestId,
            {
              latestMessage: newMessage._id,
            },
            session,
          );
      }
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
const sendPmsRequest = async (property, guest, propertySetting, roomNumber) => {
  let result;
  if (property.property.pmsId && guest.pmsId) {
    switch (propertySetting.pmsType) {
      case PMS_TYPE.ASI: {
        result = await asiPmsService.changeRoomStatus(
          property.property.pmsId,
          propertySetting.asiApplicationId,
          propertySetting.asiSecurityKey,
          propertySetting.asiHouseKeepingUrl,
          roomNumber,
          ROOM_STATUS_CODE.IN_HOUSE_DIRTY,
        );
        break;
      }
      case PMS_TYPE.HOTEL_KEY:
        {
          result = await hotelKeyPmsService.change;
        }
        break;
      default:
        throw new ValidationError("Unsupported PMS type", {
          pmsType: propertySetting.pmsType,
        });
    }
  }
  return result;
};

module.exports = {
  create,
  updateStatus,
  get,
};
