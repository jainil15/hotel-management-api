const GUEST_CURRENT_STATUS = {
  RESERVED: "Reservation",
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
  NOT_APPLIED: "Not Applied",
  APPLIED: "Applied",
};

const GUEST_REQUEST = {
  RESERVATION: "Reservation Cancelled",
  EARLY_CHECK_IN: "Early Check In",
  LATE_CHECK_OUT: "Late Check Out",
};
const GUEST_CURRENT_ALLOWED_FLAG = {
  RESERVATION_STATUS: ["Reservation cancelled"],
  IN_HOUSE: ["Early Check In"],
};
module.exports = {
  LATE_CHECK_OUT_STATUS,
  EARLY_CHECK_IN_STATUS,
  RESERVATION_STATUS,
  GUEST_CURRENT_STATUS,
  PRE_ARRIVAL_STATUS,
};
