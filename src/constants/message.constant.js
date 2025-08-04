const messageType = {
  SMS: "SMS",
  REQUEST: "Request",
  ADDONS_REQUEST: "Addons Request",
  REVIEW_REPLY: "Review Reply",
};

const messageTriggerType = {
  MANUAL: "Manual",
  BROADCAST: "Broadcast",
  AUTOMATIC: "Automatic",
};

const requestType = {
  earlyCheckIn: "Early Check In",
  lateCheckOut: "Late Check Out",
  customAddons: "Custom Addons",
  extendStay: "Extend Stay",
  housekeeping: "Housekeeping",
};

module.exports = { messageType, messageTriggerType, requestType };
