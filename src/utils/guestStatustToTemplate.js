const {
	GUEST_CURRENT_STATUS,
	RESERVATION_STATUS,
	EARLY_CHECK_IN_STATUS,
	LATE_CHECK_OUT_STATUS,
} = require("../constants/guestStatus.contant");
const { STATUS_TO_TEMPLATE } = require("../constants/messageTemplate.contant");

/**
 * Convert guest status to template
 * @param {import('../models/guestStatus.model').GuestStatusType} oldStatus - The guest status
 * @param {import('../models/guestStatus.model').GuestStatusType} newStatus - The guest status
 * @returns {string} - The message template name
 */
const guestStatusToTemplate = (oldStatus, newStatus) => {
	if (oldStatus.currentStatus !== newStatus.currentStatus) {
		return STATUS_TO_TEMPLATE.currentStatus[oldStatus.currentStatus];
	}
	// biome-ignore lint/complexity/noForEach: <explanation>
	Object.keys(STATUS_TO_TEMPLATE).forEach((key) => {
		if (oldStatus[key] !== newStatus[key]) {
			return STATUS_TO_TEMPLATE[key][newStatus[key]];
		}
	});
	return "Reservation Confirmed";
};

/**
 * Convert guest status to template on create
 * @param {import('../models/guestStatus.model').GuestStatusType} status - The guest status
 * @returns {string} - The message template name
 */
const guestStatusToTemplateOnCreate = (status) => {
	switch (status.currentStatus) {
		case GUEST_CURRENT_STATUS.RESERVED:
			if (
				status.earlyCheckInStatus === EARLY_CHECK_IN_STATUS.ACCEPTED &&
				status.lateCheckOutStatus === LATE_CHECK_OUT_STATUS.ACCEPTED
			) {
				return "Early Check In Accepted and Late Check Out Accepted";
			}
			if (status.earlyCheckInStatus === EARLY_CHECK_IN_STATUS.ACCEPTED) {
				return "Early Check In Accepted";
			}
			if (status.lateCheckOutStatus === LATE_CHECK_OUT_STATUS.ACCEPTED) {
				return "Late Check Out Accepted";
			}
			return "Reservation Confirmed";
		case GUEST_CURRENT_STATUS.IN_HOUSE:
			if (
				status.earlyCheckInStatus === EARLY_CHECK_IN_STATUS.ACCEPTED &&
				status.lateCheckOutStatus === LATE_CHECK_OUT_STATUS.ACCEPTED
			) {
				return "Early Check In Accepted and Late Check Out Accepted";
			}
			if (status.earlyCheckInStatus === EARLY_CHECK_IN_STATUS.ACCEPTED) {
				return "Early Check In Accepted";
			}
			if (status.lateCheckOutStatus === LATE_CHECK_OUT_STATUS.ACCEPTED) {
				return "Late Check Out Accepted";
			}
			return "Checked In";
		case GUEST_CURRENT_STATUS.CHECKED_OUT:
			return "Checked Out";
		default:
			return "Reservation Confirmed";
	}
};

/**
 * Convert guest status to template on update
 * @param {import('../models/guestStatus.model').GuestStatusType} oldStatus - The old guest status
 * @param {import('../models/guestStatus.model').GuestStatusType} newStatus - The new guest status
 * @returns {string} - The message template name
 */
const guestStatusToTemplateOnUpdate = (oldStatus, newStatus) => {
	if (oldStatus.currentStatus !== newStatus.currentStatus) {
		if (newStatus.currentStatus === GUEST_CURRENT_STATUS.CHECKED_OUT) {
			return "Checked Out";
		}
		if (newStatus.currentStatus === GUEST_CURRENT_STATUS.IN_HOUSE) {
			return "Checked In";
		}
	}
	if (oldStatus.reservationStatus !== newStatus.reservationStatus) {
		if (newStatus.reservationStatus === RESERVATION_STATUS.CANCELLED) {
			return "Reservation Cancelled";
		}
		return "Reservation Confirmed";
	}
	if (
		oldStatus.earlyCheckInStatus !== newStatus.earlyCheckInStatus &&
		oldStatus.lateCheckOutStatus !== newStatus.lateCheckOutStatus
	) {
		if (
			newStatus.earlyCheckInStatus === EARLY_CHECK_IN_STATUS.ACCEPTED &&
			newStatus.lateCheckOutStatus === LATE_CHECK_OUT_STATUS.ACCEPTED
		) {
			return "Early Check In Accepted and Late Check Out Accepted";
		}
	}
	if (oldStatus.earlyCheckInStatus !== newStatus.earlyCheckInStatus) {
		if (newStatus.earlyCheckInStatus === EARLY_CHECK_IN_STATUS.ACCEPTED) {
			return "Early Check In Accepted";
		}
		if (newStatus.earlyCheckInStatus === EARLY_CHECK_IN_STATUS.DECLINED) {
			return "Early Check In Declined";
		}
	}
	if (oldStatus.lateCheckOutStatus !== newStatus.lateCheckOutStatus) {
		if (newStatus.lateCheckOutStatus === LATE_CHECK_OUT_STATUS.ACCEPTED) {
			return "Late Check Out Accepted";
		}
		if (newStatus.lateCheckOutStatus === LATE_CHECK_OUT_STATUS.DECLINED) {
			return "Late Check Out Declined";
		}
	}
	return "";
};

module.exports = {
	guestStatusToTemplate,
	guestStatusToTemplateOnCreate,
	guestStatusToTemplateOnUpdate,
};
