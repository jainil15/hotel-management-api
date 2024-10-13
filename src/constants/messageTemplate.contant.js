const {
  GUEST_CURRENT_STATUS,
  RESERVATION_STATUS,
  LATE_CHECK_OUT_STATUS,
  EARLY_CHECK_IN_STATUS,
  EXTEND_STAY_STATUS,
} = require("./guestStatus.contant");

const DEFAULT_MESSAGE_TEMPLATES = {
  Reservation: {
    [RESERVATION_STATUS.CANCELLED]: {
      message:
        "Your reservation at [Hotel Name] has been cancelled. Reply here for questions.",
      name: "Reservation Cancelled",
    },
  },
  "Early Check In": {
    [EARLY_CHECK_IN_STATUS.DECLINED]: {
      message:
        "Your early check-in request at [Hotel Name] has been declined. Check-in begins at [Time]. Reply here for questions.",
      name: "Early Check In Declined",
    },
    [EARLY_CHECK_IN_STATUS.ACCEPTED]: {
      message:
        "Your early check-in at [Hotel Name] is confirmed. Check-in available at [Time]. Reply here for questions.",
      name: "Early Check In Accepted",
    },
  },
  "Late Check Out": {
    [LATE_CHECK_OUT_STATUS.DECLINED]: {
      message:
        "Your request for late check-out at [Hotel Name] has been declined. Please check out by [Time]. Reply here for questions.",
      name: "Late Check Out Declined",
    },
    [LATE_CHECK_OUT_STATUS.ACCEPTED]: {
      message:
        "Your late check-out request at [Hotel Name] is accepted. Check out by [Time]. Reply here for questions.",
      name: "Late Check Out Accepted",
    },
  },
  "Current Status": {
    [GUEST_CURRENT_STATUS.RESERVED]: {
      message:
        "Your reservation at [Hotel Name] is confirmed! We look forward to welcoming you on [Date]. Reply here for questions.",
      name: "Reservation Confirmed",
    },
    [GUEST_CURRENT_STATUS.IN_HOUSE]: {
      message:
        "Welcome to [Hotel Name]! You've successfully checked in. Enjoy your stay. Reply here for questions",
      name: "Checked In",
    },
    [GUEST_CURRENT_STATUS.CHECKED_OUT]: {
      message:
        "Thank you for staying at [Hotel Name]. You’ve successfully checked out. We hope to welcome you back soon. Reply here for questions.",
      name: "Checked Out",
    },
  },
  "Extend Stay": {
    [EXTEND_STAY_STATUS.DECLINED]: {
      message:
        "Your request to extend your stay at [Hotel Name] has been declined. Please check out by [Original Checkout Date]. Reply here for questions.",
      name: "Extend Stay Declined",
    },
    [EXTEND_STAY_STATUS.ACCEPTED]: {
      message:
        "Your request to extend your stay at [Hotel Name] has been accepted. You are confirmed for an extended stay until [New Checkout Date]. Reply here for questions.",
      name: "Extend Stay Accepted",
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
