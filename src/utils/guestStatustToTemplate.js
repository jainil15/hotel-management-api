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

module.exports = { guestStatusToTemplate };
