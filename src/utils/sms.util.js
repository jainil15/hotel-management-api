const messageTemplateService = require("../services/messageTemplate.service");
const messageService = require("../services/message.service");
const propertyService = require("../services/property.service");
const chatListService = require("../services/chatList.service");
const smsService = require("../services/sms.service");
const {
  messageType,
  messageTriggerType,
} = require("../constants/message.constant");
const {
  modifyAddOnsMessageTemplateBody,
} = require("./messageTemplateUpdate.js");
const logger = require("../configs/winston.config");

const sendSmsMessageTemplate = async (
  req,
  propertyId,
  twilioAccount,
  twilioClient,
  guest,
  createdAddOnsRequest,
  templateName,
  session,
) => {
  const messageTemplate =
    await messageTemplateService.getMessageTemplateByStatus(
      propertyId,
      templateName,
    );
  const { property } = await propertyService.getById(propertyId);
  if (messageTemplate === null) {
    return;
  }
  const messageBody = modifyAddOnsMessageTemplateBody(
    messageTemplate,
    property,
    guest,
    createdAddOnsRequest,
  );
  Promise.all([
    smsService.send(
      twilioClient,
      `${twilioAccount.countryCode}${twilioAccount.phoneNumber}`,
      `${guest.countryCode}${guest.phoneNumber}`,
      messageBody.message,
    ),
  ])
    .then((result) => {
      logger.info(`SMS sent successfully: \n ${JSON.stringify(result)}`);
    })
    .catch((error) => {
      logger.error(`Error sending sms: \n ${JSON.stringify(error)}`);
    });

  const newMessage = await messageService.create(
    {
      propertyId: propertyId,
      guestId: guest._id,
      senderId: propertyId,
      receiverId: guest._id,
      content: `${messageBody.message}`,
      messageType: messageType.ADDONS_REQUEST,
      messageTriggerType: messageTriggerType.AUTOMATIC,
      addOnsRequestId: createdAddOnsRequest._id,
    },
    session,
  );

  req.app.io.to(`guest:${guest._id}`).emit("message:newMessage", {
    message: newMessage,
  });
};
module.exports = {
  sendSmsMessageTemplate,
};
