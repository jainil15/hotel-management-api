const {
  GUEST_CURRENT_STATUS,
  RESERVATION_STATUS,
  LATE_CHECK_OUT_STATUS,
  EARLY_CHECK_IN_STATUS,
  EXTEND_STAY_STATUS,
} = require("./guestStatus.contant");
const { ADD_ONS_STATUS } = require("./addOns.constant");

const DEFAULT_MESSAGE_TEMPLATES = {
  Reservation: {
    [RESERVATION_STATUS.CANCELLED]: {
      message: `Your reservation at [Hotel Name] has been cancelled.\n If there’s anything we can assist with or if you’d like to book again, visit [Guest Link] or reply to this message. We’d love to help!
`,
      name: "Reservation Cancelled",
    },
    [RESERVATION_STATUS.NO_SHOW]: {
      message:
        "We noticed you didn’t check in for your reservation at [Hotel Name]. If you need assistance or would like to rebook, please reply to this message or visit [Guest Link]. We’re here to help!",
      name: "No Show",
    },
  },
  "Early Check In": {
    [EARLY_CHECK_IN_STATUS.DECLINED]: {
      message: `We’re sorry, but your early check-in request at [Hotel Name] has been declined. Check-in begins at [Time].
For other requests or assistance, visit [Guest Link] or reply to this message.
`,
      name: "Early Check In Declined",
    },
    [EARLY_CHECK_IN_STATUS.ACCEPTED]: {
      message: `Great news! Your early check-in at [Hotel Name] is confirmed! 🎉 Check-in begins at [Time].
Get ready to relax—explore amenities, access the Wi-Fi password, or request services here: [Guest Link].
`,
      name: "Early Check In Accepted",
    },
  },
  "Late Check Out": {
    [LATE_CHECK_OUT_STATUS.DECLINED]: {
      message: `We’re sorry, but your late check-out request at [Hotel Name] was declined. Please check out by [Time].
Need help or want to explore other options? Click here: [Guest Link].`,
      name: "Late Check Out Declined",
    },
    [LATE_CHECK_OUT_STATUS.ACCEPTED]: {
      message: `Good news! Your late check-out at [Hotel Name] is confirmed. 🎉 Please check out by [Time].
Enjoy more time to relax! Manage requests or explore our amenities here: [Guest Link].`,
      name: "Late Check Out Accepted",
    },
  },
  "Current Status": {
    [GUEST_CURRENT_STATUS.RESERVED]: {
      message:
        "Your reservation for [Date] at [Hotel Name] is confirmed! 🎉From requesting housekeeping to accessing the Wi-Fi password or exploring amenities, manage everything with ease here: [Guest Link].\n Need anything else? Click the link or reply to this message—we’re here to help!",
      name: "Reservation Confirmed",
    },
    [GUEST_CURRENT_STATUS.IN_HOUSE]: {
      message: `Welcome to [Hotel Name]! 🎉 You’re all checked in.
Make your stay even better—request housekeeping, explore amenities, or chat with the front desk anytime here: [Guest Link].
`,
      name: "Checked In",
    },
    [GUEST_CURRENT_STATUS.CHECKED_OUT]: {
      message: `Thank you for staying at [Hotel Name]! 🏨 You’ve successfully checked out.
We’d love your feedback! Share your experience or book your next stay here: [Guest Link].
`,
      name: "Checked Out",
    },
  },
  "Extend Stay": {
    [EXTEND_STAY_STATUS.DECLINED]: {
      message: `We’re sorry, but your request to extend your stay at [Hotel Name] has been declined. Please check out by [Original Checkout Date].
Have questions or need assistance? Visit [Guest Link] or reply to this message.
`,
      name: "Extend Stay Declined",
    },
    [EXTEND_STAY_STATUS.ACCEPTED]: {
      message: `Your stay at [Hotel Name] is extended until [New Checkout Date]! 🎉
Enjoy more time with us—explore amenities, request housekeeping, or share feedback here: [Guest Link].`,
      name: "Extend Stay Accepted",
    },
  },
  "Add Ons": {
    [ADD_ONS_STATUS.REQUESTED]: {
      message:
        "Your request for [Service Name] has been successfully received. Our team is processing it immediately. Please do not hesitate to contact us for any further assistance.",
      name: "AddOns Requested",
    },
    [ADD_ONS_STATUS.ACCEPTED]: {
      message:
        "Your request for [Service Name] has been accepted and is now in progress. Thank you for choosing [Hotel Name].",
      name: "AddOns Accepted",
    },
    [ADD_ONS_STATUS.REJECTED]: {
      message:
        "Dear [Guest Name], we’re sorry, but your request for [Service Name] cannot be fulfilled at this time. Please reply back us if you need further assistance. – [Hotel Name]",
      name: "AddOns Rejected",
    },
  },
  PhoneNumber: {
    Changed: {
      message:
        "Your phone number has been successfully changed to [New Phone Number]. If you have any questions or need further assistance, please reply to this message or visit [Guest Link].",
      name: "PhoneNumber Changed",
    },
  },
};

const MESSAGE_TEMPLATE_TYPES = {
  DEFAULT: "Default",
  CUSTOM: "Custom",
};

const STATUS_TO_TEMPLATE = {
  currentStatus: {
    [GUEST_CURRENT_STATUS.IN_HOUSE]: "Checked In",
    [GUEST_CURRENT_STATUS.RESERVED]: "Reservation Confirmed",
    [GUEST_CURRENT_STATUS.CHECKED_OUT]: "Checked Out",
  },
  reservationStatus: {
    [RESERVATION_STATUS.CANCELLED]: "Reservation Cancelled",
    [RESERVATION_STATUS.CONFIRMED]: "Reservation Confirmed",
  },
  earlyCheckInStatus: {
    [EARLY_CHECK_IN_STATUS.DECLINED]: "Early Check In Declined",
    [EARLY_CHECK_IN_STATUS.ACCEPTED]: "Early Check In Accepted",
  },
  extendSatyStatus: {
    [EXTEND_STAY_STATUS.DECLINED]: "Extend Stay Declined",
    [EXTEND_STAY_STATUS.ACCEPTED]: "Extend Stay Accepted",
  },
};

module.exports = {
  DEFAULT_MESSAGE_TEMPLATES,
  MESSAGE_TEMPLATE_TYPES,
  STATUS_TO_TEMPLATE,
};
