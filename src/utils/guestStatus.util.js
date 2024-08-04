const {
	GUEST_CURRENT_STATUS,
	RESERVATION_STATUS,
	PRE_ARRIVAL_STATUS,
	EARLY_CHECK_IN_STATUS,
	LATE_CHECK_OUT_STATUS,
} = require("../constants/guestStatus.contant");
const { GuestStatus } = require("../models/guestStatus.model");

const AllowStatusForCurrentStatus = {
	"In House": ["preArrivalStatus", "earlyCheckInStatus"],
	Reservation: ["reservationStatus", "earlyCheckInStatus", "preArrivalStatus"],
	"Checked Out": [],
};

const AllowedStatus = {
	Reservation: {
		reservationStatus: ["Confirmed", "Cancelled"],
	},
	"In House": {
		reservationStatus: ["Confirmed"],
		preArrivalStatus: ["Not Applied", "Applied"],
		earlyCheckInStatus: ["Not Requested", "Requested", "Accepted", "Declined"],
	},
	"Checked Out": {
		lateCheckOutStatus: ["Not Requested", "Requested", "Accepted", "Declined"],
	},
};

/**
 * Perform validation on update guest status
 * @param {import('../models/guestStatus.model.js').GuestStatusType} currentGuestStatus - current guest status
 * @param {import('../models/guestStatus.model.js').GuestStatusType} updateGuestStatus - updated guest status
 * @returns {boolean} - true if valid, false otherwise
 */
const validateUpdate = (currentGuestStatus, updateGuestStatus) => {
	if (currentGuestStatus.currentStatus === updateGuestStatus.currentStatus) {
		switch (currentGuestStatus.currentStatus) {
			case GUEST_CURRENT_STATUS.RESERVED:
				if (
					currentGuestStatus.reservationStatus === RESERVATION_STATUS.CANCELLED
				) {
					if (
						updateGuestStatus.reservationStatus !==
						currentGuestStatus.reservationStatus
					) {
						return true;
					}
					return false;
				}
				if (
					currentGuestStatus.reservationStatus === RESERVATION_STATUS.CONFIRMED
				) {
					if (
						currentGuestStatus.lateCheckOutStatus !==
						updateGuestStatus.lateCheckOutStatus
					) {
						return false;
					}
				}

				return true;
			case GUEST_CURRENT_STATUS.IN_HOUSE:
				if (currentGuestStatus.reservationStatus === "Cancelled") {
					return false;
				}
				if (
					currentGuestStatus.preArrivalStatus !==
						updateGuestStatus.preArrivalStatus ||
					currentGuestStatus.earlyCheckInStatus !==
						updateGuestStatus.earlyCheckInStatus
				) {
					return false;
				}
				return true;
			case GUEST_CURRENT_STATUS.CHECKED_OUT:
				if (currentGuestStatus.reservationStatus === "Cancelled") {
					return false;
				}
				if (
					currentGuestStatus.preArrivalStatus !==
						updateGuestStatus.preArrivalStatus ||
					currentGuestStatus.earlyCheckInStatus !==
						updateGuestStatus.earlyCheckInStatus ||
					currentGuestStatus.lateCheckOutStatus !==
						updateGuestStatus.lateCheckOutStatus
				) {
					return false;
				}
				return true;
		}
	}
	return validateStatus(updateGuestStatus);
};

/**
 * Perform validation on guest status
 * @param {object} guestStatus - guest status
 * @returns {boolean} - true if valid, false otherwise
 */
const validateStatus = (guestStatus) => {
	const currentStatus = guestStatus.currentStatus;

	const status = AllowedStatus[currentStatus];

	for (const key in guestStatus) {
		if (Object.keys(status).includes(key)) {
			if (!status[key].includes(guestStatus[key])) {
				return false;
			}
		}
	}
	return true;
};

const GUEST_ALLOWED_STATUS = {
	[GUEST_CURRENT_STATUS.RESERVED]: {
		reservationStatus: [RESERVATION_STATUS.CANCELLED],
		earlyCheckInStatus: [EARLY_CHECK_IN_STATUS.REQUESTED],
		preArrivalStatus: [PRE_ARRIVAL_STATUS.APPLIED],
	},
	[GUEST_CURRENT_STATUS.IN_HOUSE]: {
		lateCheckOutStatus: [LATE_CHECK_OUT_STATUS.REQUESTED],
	},
};
/**
 * Perform validation on update guest guest status
 * @param {import('../models/guestStatus.model.js').GuestStatusType} currentGuestStatus - current guest status
 * @param {import('../models/guestStatus.model.js').GuestStatusType} updatedGuestStatus - updated guest status
 * @returns {boolean} - true if valid, false otherwise
 */
const validateStatusForGuest = (currentGuestStatus, updatedGuestStatus) => {
	if (currentGuestStatus.currentStatus !== updatedGuestStatus.currentStatus) {
		return false;
	}

	for (const key in GUEST_ALLOWED_STATUS[currentGuestStatus.currentStatus]) {
		if (currentGuestStatus[key] !== updatedGuestStatus[key]) {
			if (
				!GUEST_ALLOWED_STATUS[currentGuestStatus.currentStatus][key].includes(
					updatedGuestStatus[key],
				)
			) {
				console.log(
					"key",
					key,
					currentGuestStatus[key],
					updatedGuestStatus[key],
				);
				return false;
			}
		}
	}
	return true;
};

module.exports = { validateUpdate, validateStatus, validateStatusForGuest };
