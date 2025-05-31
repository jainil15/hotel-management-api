const moment = require("moment-timezone");
const names = [
  "Extend Stay Declined",
  "Check Out Time Update",
  "Check In Time Update",
  "Extend Stay Accepted",
  "Checked Out",
  "Checked In",
  "Reservation Confirmed",
  "Reservation Cancelled",
  "Late Check Out Accepted",
  "Late Check Out Declined",
  "Early Check In Accepted",
  "Early Check In Declined",
  "Pre Arrival Complete",
];
const timeZoneMapping = {
  "Hawaii–Aleutian Standard Time (UTC-10:00)": "Pacific/Honolulu",
  "Alaska Standard Time (UTC-09:00)": "America/Anchorage",
  "Pacific Standard Time (North America) (UTC-08:00)": "America/Los_Angeles",
  "Mountain Standard Time (North America) (UTC-07:00)": "America/Denver",
  "Central Standard Time (North America) (UTC-06:00)": "America/Chicago",
  "Eastern Standard Time (North America) (UTC-05:00)": "America/New_York",
};

function formatDateToUTC(date) {
  const utcDate = new Date(date);

  // Extracting individual components in UTC time
  const hours = utcDate.getUTCHours();
  const minutes = utcDate.getUTCMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";

  // Converting to 12-hour format
  const formattedHours = hours % 12 || 12; // Convert '0' hours to '12'
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

  // Building the formatted date string
  const day = utcDate.getUTCDate();
  const month = utcDate.getUTCMonth() + 1; // Months are zero-indexed
  const year = utcDate.getUTCFullYear();

  return `${formattedHours}:${formattedMinutes} ${ampm}, ${month}/${day}/${year} UTC`;
}

function formatDateWithLocalTimezone(utcDateString, timeZone) {
  const localMoment = moment.tz(utcDateString, timeZone);
  return localMoment.format("MM/DD, hh:mm A");
}

// Update the modifyMessageTemplateBody function
function modifyMessageTemplateBody(
  messageTemplate,
  guestInfo,
  propertyInfo,
  propertySetting,
  guestLink,
  reason,
) {
  const { name: hotelName } = propertyInfo;

  if (
    messageTemplate.name === "Late Check Out Accepted" ||
    messageTemplate.name === "Early Check In Accepted" ||
    messageTemplate.name === "Late Check Out Declined" ||
    messageTemplate.name === "Early Check In Declined"
  ) {
    const time = messageTemplate.name.includes("Early")
      ? guestInfo.checkIn
      : guestInfo.checkOut;
    // Format time as UTC
    const formattedTime = new Date(time).toLocaleString("en", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC",
    });
    messageTemplate.message = messageTemplate.message
      .replace("[Time]", formattedTime + ` ${propertySetting.timezone}`)
      .replace("[Hotel Name]", hotelName)
      .replace("[Guest Link]", guestLink)
      .replace("[Reason]", reason)
      .replace("[Phone Number]", guestInfo.phoneNumber);
  } else if (messageTemplate.name === "Extend Stay Accepted") {
    const formattedTime = new Date(guestInfo.checkOut).toLocaleString("en", {
      year: "numeric",
      day: "2-digit",
      month: "2-digit",
      timeZone: "UTC",
    });
    messageTemplate.message = messageTemplate.message
      .replace(
        "[New Checkout Date]",
        formattedTime + ` ${propertySetting.timezone}`,
      )
      .replace("[Hotel Name]", hotelName)
      .replace("[Guest Link]", guestLink);
  } else if (messageTemplate.name === "Extend Stay Declined") {
    const formattedTime = new Date(guestInfo.checkOut).toLocaleString("en", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC",
    });
    messageTemplate.message = messageTemplate.message
      .replace(
        "[Original Checkout Date]",
        formattedTime + ` ${propertySetting.timezone}`,
      )
      .replace("[Hotel Name]", hotelName)
      .replace("[Guest Link]", guestLink);
  } else if (messageTemplate.name === "Reservation Confirmed") {
    const formattedDate = formatDateToUTC(guestInfo.checkIn);

    messageTemplate.message = messageTemplate.message
      .replace("[Date]", formattedDate + ` ${propertySetting.timezone}`)
      .replace("[Hotel Name]", hotelName)
      .replace("[Guest Link]", guestLink);
  } else if (
    messageTemplate.name === "Checked In" ||
    messageTemplate.name === "Checked Out" ||
    messageTemplate.name === "Reservation Cancelled" ||
    messageTemplate.name === "Pre Arrival Complete"
  ) {
    messageTemplate.message = messageTemplate.message
      .replace("[Hotel Name]", hotelName)
      .replace("[Guest Link]", guestLink);
  } else if (messageTemplate.name === "Check Out Time Update") {
    const formattedTime = new Date(guestInfo.checkOut).toLocaleString("en", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC",
    });
    messageTemplate.message = messageTemplate.message
      .replace("[Time]", formattedTime + ` ${propertySetting.timezone}`)
      .replace("[Hotel Name]", hotelName)
      .replace("[Guest Link]", guestLink);
  } else if (messageTemplate.name === "Check In Time Update") {
    const formattedTime = new Date(guestInfo.checkIn).toLocaleString("en", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC",
    });
    messageTemplate.message = messageTemplate.message
      .replace("[Time]", formattedTime + ` ${propertySetting.timezone}`)
      .replace("[Hotel Name]", hotelName)
      .replace("[Guest Link]", guestLink);
  }

  return messageTemplate;
}

/**
 * Modify the message template body for add-ons
 * @param {object} messageTemplate - The message template object
 * @property {object} property - The property object
 * @property {object} guest - The guest object
 * @property {object} addOn - The add-on object
 * @returns {object} - The modified message template
 */
const modifyAddOnsMessageTemplateBody = (
  messageTemplate,
  property,
  guest,
  addOn,
) => {
  console.log(property.name, addOn);
  messageTemplate.message = messageTemplate.message
    .replace("[Hotel Name]", property.name)
    .replace("[Guest Name]", `${guest.firstName} ${guest.lastName}`)
    .replace("[Service Name]", addOn.name);
  return messageTemplate;
};

module.exports = {
  modifyMessageTemplateBody,
  modifyAddOnsMessageTemplateBody,
};
