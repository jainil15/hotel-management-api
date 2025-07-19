/**
 * Change the status of a room in the ASI PMS system.
 * @param {string} clientId - The client ID
 * @param {string} applicationId - The application ID
 * @param {string} securityKey - The security key
 * @param {string} roomNo - The room number
 * @param {string} status - The new status
 * @returns {Promise<object>} - The response
 * @throws {Error}
 */
const changeRoomStatus = async (
  clientId,
  applicationId,
  securityKey,
  houseKeepingUrl,
  roomNo,
  status,
) => {
  console.log("Changing room status in ASI PMS");
  const url = houseKeepingUrl;
  const headers = {
    "Content-Type": "application/json",
    ClientID: clientId,
    ApplicationID: applicationId,
    SecurityKey: securityKey,
    Host: "demo.asifrontdesk.com:8010",
  };
  const body = [
    {
      RoomName: roomNo,
      StatusCode: status,
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
    if (data.Response[0].Status === "Fail") {
      throw new Error(data.Response[0].Remark);
    }
    return data;
  }
  console.error("Error changing room status:", data);
  throw new Error("Error changing room status");
};

module.exports = {
  changeRoomStatus,
};
