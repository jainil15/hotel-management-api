const cron = require("node-cron");

const logger = require("../configs/winston.config");
const { Guest } = require("../models/guest.model");
const { Setting } = require("../models/setting.model");
const { GuestStatus } = require("../models/guestStatus.model");
const messageTemplateService = require("../services/messageTemplate.service");
const messageService = require("../services/message.service");
const guestStatusService = require("../services/guestStatus.service");
const checkInOutRequestService = require("../services/checkInOutRequest.service");
const guestService = require("../services/guest.service");
const propertyService = require("../services/property.service");
const twilioAccountService = require("../services/twilioAccount.service");
const twilioService = require("../services/twilio.service");
const settingService = require("../services/setting.service");
const { REQUEST_STATUS } = require("../constants/guestStatus.contant");
const smsService = require("../services/sms.service");
const guestSessionService = require("../services/guestSession.service");
const {
  messageTriggerType,
  requestType,
  messageType,
} = require("../constants/message.constant");
const {
  RESERVATION_STATUS,
  GUEST_CURRENT_STATUS,
} = require("../constants/guestStatus.contant");
const {
  ValidationError,
  APIError,
  InternalServerError,
  ConflictError,
  NotFoundError,
} = require("../lib/CustomErrors");

const timeZoneMapping = {
  "Hawaii–Aleutian Standard Time (UTC-10:00)": "Pacific/Honolulu",
  "Alaska Standard Time (UTC-09:00)": "America/Anchorage",
  "Pacific Standard Time (North America) (UTC-08:00)": "America/Los_Angeles",
  "Mountain Standard Time (North America) (UTC-07:00)": "America/Denver",
  "Central Standard Time (North America) (UTC-06:00)": "America/Chicago",
  "Eastern Standard Time (North America) (UTC-05:00)": "America/New_York",
};

const sendMessageToTodayCheckoutGuests = async (propertyId) => {
  try {
    const guestsCheckingOutToday = await Guest.find({
      propertyId: propertyId,
      $expr: {
        $eq: [
          { $dateToString: { format: "%Y-%m-%d", date: "$checkOut" } },
          { $dateToString: { format: "%Y-%m-%d", date: new Date() } },
        ],
      },
    });

    if (!guestsCheckingOutToday.length) {
      logger.info(
        `No guests found checking out today for property ID: ${propertyId}`,
      );
      return;
    }

    for (const guest of guestsCheckingOutToday) {
      const guestId = guest._id;
      const checkGuestStatus = await GuestStatus.findOne({ guestId });
      if (
        checkGuestStatus.currentStatus === "In House" &&
        checkGuestStatus.lateCheckOutStatus !== "Accepted"
      ) {
        const guestSession = await guestSessionService.getGuestSession(
          propertyId,
          guestId,
        );
        if (!guestSession) {
          logger.error(`Guest session not found for guest ID: ${guestId}`);
          continue;
        }
        const propertySetting =
          await settingService.getByPropertyId(propertyId);
        if (!propertySetting) {
          console.error(
            `Property settings not found for property ID: ${propertyId}`,
          );
          continue;
        }
        const formattedTime = new Date(guest.checkOut).toLocaleString("en", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          timeZone: "UTC",
        });
        const twilioAccount =
          await twilioAccountService.getByPropertyId(propertyId);
        if (!twilioAccount) {
          console.error(
            `Twilio account not found for property ID: ${propertyId}`,
          );
          continue;
        }
        const twilioSubClient =
          await twilioService.getTwilioClient(twilioAccount);
        const messageBody = `Hi ${guest.firstName}! A friendly remainder that your checkout is scheduled for today at ${formattedTime} ${propertySetting.timezone}.If you’d like a late checkout or to extend your stay, please click here:\n ${process.env.MOBILE_FRONTEND_URL}/${guestSession._id}. or feel free to reply with any questions.`;
        const recipientPhoneNumber = `${guest.countryCode}${guest.phoneNumber}`;
        const senderPhoneNumber = `${twilioAccount.countryCode}${twilioAccount.phoneNumber}`;
        if (guest.phoneNumber && guest.countryCode && !guest.draft) {
          const sentSms = await smsService.send(
            twilioSubClient,
            senderPhoneNumber,
            recipientPhoneNumber,
            messageBody,
          );

          await messageService.create({
            propertyId: propertyId,
            guestId: guestId,
            senderId: propertyId,
            receiverId: guestId,
            content: messageBody,
            messageTriggerType: messageTriggerType.AUTOMATIC,
            messageType: messageType.SMS,
            messageSid: sentSms.sid,
          });
        }
      }
    }

    logger.info(
      `Messages sent to all guests checking out today for property ID: ${propertyId}.`,
    );
  } catch (e) {
    logger.error("Error sending messages to guests checking out today:", e);
  }
};
const cancelExpiredReservations = async () => {
  try {
    const today = new Date(
      Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        new Date().getUTCDate(),
      ),
    );

    const guestsStatuses = await GuestStatus.find({
      currentStatus: GUEST_CURRENT_STATUS.RESERVED,
    }).populate("guestId");
    const guestsToCancel = guestsStatuses.filter((guestStatus) => {
      const guest = guestStatus.guestId; // Accessing the guest details
      if (!guest) {
        logger.warn("Guest is null for guestStatus:", guestStatus);
        return false; // Skip this entry if guest is null
      }
      return new Date(guest.checkOut) < today; // Comparing UTC dates
    });

    const updates = guestsToCancel.map((guestStatus) => {
      return GuestStatus.updateOne(
        { _id: guestStatus._id },
        { reservationStatus: RESERVATION_STATUS.CANCELLED },
      );
    });

    await Promise.all(updates);

    logger.info(
      `Cancelled ${guestsToCancel.length} reservations for expired guests.`,
    );
  } catch (error) {
    logger.error("Error in cancelling expired reservations:", error);
  }
};

const scheduleDailyCheckoutMessages = async () => {
  try {
    const properties = await Setting.find({});

    properties.forEach((property) => {
      const { propertyId, timezone } = property;

      const mappedTimezone = timeZoneMapping[timezone];
      if (!mappedTimezone) {
        console.error(
          `Timezone ${timezone} for property ID: ${propertyId} is not recognized.`,
        );
        return;
      }

      cron.schedule(
        "30 8 * * *",
        async () => {
          logger.info(
            `Starting daily guest checkout message job for property ID: ${propertyId}`,
          );
          await sendMessageToTodayCheckoutGuests(propertyId);
        },
        {
          timezone: mappedTimezone,
        },
      );

      logger.info(
        `Scheduled daily job for property ID: ${propertyId} in timezone: ${mappedTimezone}`,
      );
    });
  } catch (error) {
    console.error("Error scheduling daily checkout messages:", error);
  }
};
const scheduleDailyCancellationJob = () => {
  cron.schedule("0 0 * * *", async () => {
    logger.info("Running daily cancellation job...");
    await cancelExpiredReservations();
  });
};
scheduleDailyCheckoutMessages();
scheduleDailyCancellationJob();

module.exports = {
  scheduleDailyCheckoutMessages,
  scheduleDailyCancellationJob,
};
