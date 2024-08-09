const messageType = {
	SMS: "SMS",
	REQUEST: "Request",
};

const messageTriggerType = {
	MANUAL: "Manual",
	BROADCAST: "Broadcast",
	AUTOMATIC: "Automatic",
};

const requestType = {
	earlyCheckIn: "Early Check In",
	lateCheckOut: "Late Check Out",
};



module.exports = { messageType, messageTriggerType, requestType };
