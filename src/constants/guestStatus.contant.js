const GUEST_CURRENT_STATUS = {
  RESERVED: "Reservation Confirmed",
  IN_HOUSE: "In House",
  CHECKED_OUT: "Checked Out",
};

const EARLY_CHECK_IN_STATUS = {
  NOT_REQUESTED: "Not Requested",
  REQUESTED: "Requested",
  DECLINED: "Declined",
  ACCEPTED: "Accepted",
};

const LATE_CHECK_OUT_STATUS = {
  NOT_REQUESTED: "Not Requested",
  REQUESTED: "Requested",
  DECLINED: "Declined",
  ACCEPTED: "Accepted",
};

const RESERVATION_STATUS = {
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
};

const PRE_ARRIVAL_STATUS = {
  APPLIED: "Applied",
  NOT_APPLIED: "Not Applied",
};

module.exports = {
  LATE_CHECK_OUT_STATUS,
  EARLY_CHECK_IN_STATUS,
  RESERVATION_STATUS,
  GUEST_CURRENT_STATUS,
  PRE_ARRIVAL_STATUS,
};
