const {
	GUEST_CURRENT_STATUS,
	RESERVATION_STATUS,
	LATE_CHECK_OUT_STATUS,
	EARLY_CHECK_IN_STATUS,
} = require("./guestStatus.contant");

const DEFAULT_MESSAGE_TEMPLATES = {
	Reservation: {
		[RESERVATION_STATUS.CANCELLED]: {
			message: "Your reservation is cancelled",
			name: "Reservation Cancelled",
		},
	},
	"Early Check In": {
		[EARLY_CHECK_IN_STATUS.DECLINED]: {
			message: "Your early check in request is declined",
			name: "Early Check In Declined",
		},
		[EARLY_CHECK_IN_STATUS.ACCEPTED]: {
			message: "Your early check in request is accepted",
			name: "Early Check In Accepted",
		},
	},
	"Late Check Out": {
		[LATE_CHECK_OUT_STATUS.DECLINED]: {
			message: "Your late check out request is declined",
			name: "Late Check Out Declined",
		},
		[LATE_CHECK_OUT_STATUS.ACCEPTED]: {
			message: "Your late check out request is accepted",
			name: "Late Check Out Accepted",
		},
	},
	"Current Status": {
		[GUEST_CURRENT_STATUS.RESERVED]: {
			message: "Your reservation is confirmed",
			name: "Reservation Confirmed",
		},
		[GUEST_CURRENT_STATUS.IN_HOUSE]: {
			message: "You are checked in",
			name: "Checked In",
		},
		[GUEST_CURRENT_STATUS.CHECKED_OUT]: {
			message: "You are checked out",
			name: "Checked Out",
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
	lateCheckOutStatus: {
		[LATE_CHECK_OUT_STATUS.DECLINED]: "Late Check Out Declined",
		[LATE_CHECK_OUT_STATUS.ACCEPTED]: "Late Check Out Accepted",
	},
};

module.exports = {
	DEFAULT_MESSAGE_TEMPLATES,
	MESSAGE_TEMPLATE_TYPES,
	STATUS_TO_TEMPLATE,
};
