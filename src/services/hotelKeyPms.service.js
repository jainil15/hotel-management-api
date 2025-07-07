const settingService = require("./setting.service");
/**
 * Send housekeeping request to Hotel Key PMS
 * @param {string} pmsId - PMS ID
 * @param {import('../models/setting.model.js').SettingType} setting - PMS settings
 * @param {string} roomId - Room ID
 * @param {object} requestDetails - Details of the housekeeping request
 * @returns {Promise<object>} - Response from Hotel Key PMS
 */
const sendHouseKeepingRequest = async (
  pmsId,
  setting,
  roomNo,
  requestDetails,
) => {
  console.log("Changing room status in Hotel Key PMS");
  const url = `${process.env.HOTEL_KEY_API_URL}/thirdparty/hotelbrand/properties/${pmsId}/data-ingestion/room-status`;
  const headers = {
    "Content-Type": "application/json",
    Username: setting.hotelKey.userName,
    Password: setting.hotelKey.password,
  };
  const body = [
    {
      room_no: roomNo,
      housekeeping_status: "DIRTY",
    },
  ];
  const options = {
    method: "POST",
    headers: headers,
    body: JSON.stringify(body),
  };
  const response = await fetch(url, options);
  const data = await response.json();
  if (response.ok) {
    console.log(data);
    return data;
  }
  console.error("Error changing room status:", data);
  throw new Error("Error changing room status");
};

module.exports = {
  sendHouseKeepingRequest,
};
