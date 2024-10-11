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
];

function modifyMessageTemplateBody(messageTemplate, guestInfo, propertyInfo) {
  // Destructure property name for easier access
  const { name: hotelName } = propertyInfo;

  if (
    messageTemplate.name === "Late Check Out Accepted" ||
    messageTemplate.name === "Early Check In Accepted" ||
    messageTemplate.name === "Late Check Out Declined" ||
    messageTemplate.name === "Early Check In Declined"
  ) {
    // Determine whether to use check-in or check-out time based on the message template name
    const time = messageTemplate.name.includes("Early")
      ? guestInfo.checkIn
      : guestInfo.checkOut;

    // Format time as needed (for example, to HH:mm or another format)
    const formattedTime = new Date(time).getTime();

    // Replace placeholders with dynamic values
    messageTemplate.message = messageTemplate.message
      .replace("[Time]", time)
      .replace("[Hotel Name]", hotelName);
  } else if (messageTemplate.name === "Extend Stay Accepted") {
    // Use the check-out date for these message templates
    const formattedDate = new Date(guestInfo.checkOut).toLocaleDateString();

    // Replace placeholders with dynamic values
    messageTemplate.message = messageTemplate.message
      .replace("[New Checkout Date]", guestInfo.checkOut)
      .replace("[Hotel Name]", hotelName);
  } else if (messageTemplate.name === "Extend Stay Declined") {
    // Use the check-out date for these message templates
    const formattedDate = new Date(guestInfo.checkOut).toLocaleDateString();

    // Replace placeholders with dynamic values
    messageTemplate.message = messageTemplate.message
      .replace("[Original Checkout Date]", guestInfo.checkOut)
      .replace("[Hotel Name]", hotelName);
  } else if (messageTemplate.name === "Reservation Confirmed") {
    // Use the check-out date for these message templates
    const formattedDate = new Date(guestInfo.checkOut).toLocaleDateString();

    // Replace placeholders with dynamic values
    messageTemplate.message = messageTemplate.message
      .replace("[Date]", guestInfo.checkOut)
      .replace("[Hotel Name]", hotelName);
  } else if (
    messageTemplate.name === "Checked In" ||
    messageTemplate.name === "Checked Out" ||
    messageTemplate.name === "Reservation Cancelled"
  ) {
    // Replace only the [Hotel Name] placeholder
    messageTemplate.message = messageTemplate.message.replace(
      "[Hotel Name]",
      hotelName,
    );
  }

  return messageTemplate;
}

module.exports = {
  modifyMessageTemplateBody,
};
