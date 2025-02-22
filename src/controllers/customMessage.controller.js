const { default: mongoose } = require("mongoose");
const messageTemplateService = require("../services/messageTemplate.service");
const { guestStatusToTemplateOnCreate } = require("../utils/guestStatustToTemplate");
const twilioAccountService = require("../services/twilioAccount.service");
const settingService = require("../services/setting.service");
const { modifyMessageTemplateBody } = require("../utils/messageTemplateUpdate");
const smsService = require("../services/sms.service");
const messageService = require("../services/message.service");
const chatListService = require("../services/chatList.service");
const propertyService = require("../services/property.service");
const { responseHandler } = require("../middlewares/response.middleware");
const { APIError, InternalServerError } = require("../lib/CustomErrors");
const guestStatusService = require("../services/guestStatus.service");
const twilioService = require("../services/twilio.service");
const guestSessionService = require("../services/guestSession.service");
const {
  messageType,
  messageTriggerType,
} = require("../constants/message.constant");
const { guestedit } = require("./guest.controller");

const sendCustomMessage = async (req,res,next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    let transactionCommitted = false;  // Flag to track commit status

    try {
        const { messageId, sendMessage, status, guest } = req.body;
        const propertyId = req.params.propertyId;
        const { property } = await propertyService.getById(propertyId);
        let newMessage={};
        console.log("REQUEST BODY ---->",req.body)
        console.log("GUEST BODY ---->",guest)
      const guestStatus = await guestStatusService.getByGuestId(guest._id)
        // const sendMessageResult = z.boolean().optional().safeParse(sendMessage);
        if (sendMessage === true && guest.phoneNumber && guest.countryCode) {
            const messageTemplate =
              await messageTemplateService.getById(
                propertyId,
                messageId
              );
              console.log("MESSAGE TEMPLETAE-->",messageTemplate)
            if (messageTemplate) {
              const twilioAccount =
                await twilioAccountService.getByPropertyId(propertyId);
              const twilioSubClient =
                await twilioService.getTwilioClient(twilioAccount);
              const propertySetting = await settingService.getByPropertyId(
                property._id,
              );
              console.log("TWILIO ACCOUNT-->",twilioAccount)
              console.log("TWILIO SUB CLIENT-->",twilioSubClient)

              const guestSession = await guestSessionService.getGuestSession(
                    propertyId,
                    guest._id,
                  );
              

              const updatedMessageBody = modifyMessageTemplateBody(
                messageTemplate,
                guest,
                property,
                propertySetting,
                `${process.env.MOBILE_FRONTEND_URL}/${guestSession._id}`,
              );

              console.log("Updated Message Body-->",updatedMessageBody)


              const sentMessage = await smsService.send(
                twilioSubClient,
                `${twilioAccount.countryCode}${twilioAccount.phoneNumber}`,
                `${guest.countryCode}${guest.phoneNumber}`,
                `${updatedMessageBody.message}`,
              );

              console.log("SENT MESSAGE-->",sentMessage)

              newMessage = await messageService.create(
                {
                  propertyId: propertyId,
                  guestId: guest._id,
                  senderId: propertyId,
                  receiverId: guest._id,
                  content: sentMessage.body,
                  messageSid: sentMessage.sid,
                  messageType: messageType.SMS,
                  messageTriggerType: messageTriggerType.AUTOMATIC,
                  status: sentMessage.status,
                },
                session,
              );

              console.log("NEW MESSAGE -->",newMessage)
              const updatedChatList =
                await chatListService.updateAndIncUnreadMessages(
                  propertyId,
                  guest._id,
                  {
                    latestMessage: newMessage._id,
                  },
                  session,
                  0,
                );
            }
          }
          console.log("HERE I AM")
          await session.commitTransaction();
          transactionCommitted = true;
          session.endSession();
      
          // Trigger events
          // Emit to guest list updated
          req.app.io.to(`property:${propertyId}`).emit("guest:guestUpdate", {
            guest: { ...guest, status: { ...guestStatus } },
          });
          // Emit to chat list updated
          req.app.io.to(`property:${propertyId}`).emit("chatList:update", {});
          // Emit to guest messages updated
          req.app.io.to(`guest:${guest._id}`).emit("message:newMessage", newMessage);
          // console.log(newMessage)
      
          return responseHandler(
            res,
            {guest},
            201,
            "Message Sent",
          );

    } catch (e) {
        if (!transactionCommitted) {
          await session.abortTransaction();
        }
        session.endSession();
        if (e instanceof APIError) {
            return next(e);
        }
        return next(new InternalServerError(e.message));
    } 
};

module.exports = {sendCustomMessage}