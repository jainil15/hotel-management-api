const validateUpdate = async (currentGuestStatus, futureGuestStatus) => {
  if (currentGuestStatus.currentStatus === GUEST_CURRENT_STATUS.RESERVED) {
    if (
      currentGuestStatus.earlyCheckinStatus !==
        futureGuestStatus.earlyCheckinStatus ||
      currentGuestStatus.reservationStatus !==
        futureGuestStatus.reservationStatus ||
      currentGuestStatus.preArrivalStatus !== futureGuestStatus.preArrivalStatus
    ) {
      return true;
    }
  } else if (
    currentGuestStatus.currentStatus === GUEST_CURRENT_STATUS.IN_HOUSE
  ) {
    if (
      currentGuestStatus.lateCheckoutStatus !==
        futureGuestStatus.lateCheckoutStatus ||
      currentGuestStatus.currentStatus !== futureGuestStatus.currentStatus
    ) {
      return true;
    }
  } else if (
    currentGuestStatus.currentStatus === GUEST_CURRENT_STATUS.CHECKED_OUT
  ) {
    return false;
  }
  return false;
};

module.exports = { validateUpdate };
