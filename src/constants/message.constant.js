const messageType = {
  SMS: "SMS",
  REQUEST: "Request",
  ADDONS_REQUEST: "Addons Request",
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
};

module.exports = { messageType, messageTriggerType, requestType };
