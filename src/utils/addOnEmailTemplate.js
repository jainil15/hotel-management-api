function getAddonRequestEmail(guestName, addon, companyName) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Guest Add-On Request</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f9fafb;
          margin: 0;
          padding: 20px;
        }
        .container {
          background-color: #ffffff;
          padding: 30px;
          max-width: 600px;
          margin: auto;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
        }
        .header {
          font-size: 20px;
          color: #333333;
          margin-bottom: 20px;
          font-weight: bold;
        }
        .section {
          margin-bottom: 15px;
        }
        .label {
          font-weight: bold;
          color: #555555;
        }
        .value {
          margin-left: 5px;
          color: #333333;
        }
        .footer {
          margin-top: 30px;
          font-size: 13px;
          color: #888888;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">Guest Add-On Request Received</div>

        <p>This is an automated notification from the system. A guest has requested an additional service.</p>

        <div class="section">
          <span class="label">Guest Name:</span><span class="value">${guestName}</span>
        </div>

        <div class="section">
          <span class="label">Requested Add-on:</span>
          <p class="value">${addon}</p>
        </div>

        <p>Please review the request and ensure the necessary arrangements are made before the guest’s arrival.</p>

        <div class="footer">
          &copy; ${companyName} | All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;
}

const addOnStatusUpdateEmail = (guestName, addon, status, companyName) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Add-On Status Update</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f9fafb;
          margin: 0;
          padding: 20px;
        }
        .container {
          background-color: #ffffff;
          padding: 30px;
          max-width: 600px;
          margin: auto;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
        }
        .header {
          font-size: 20px;
          color: #333333;
          margin-bottom: 20px;
          font-weight: bold;
        }
        .section {
          margin-bottom: 15px;
        }
        .label {
          font-weight: bold;
          color: #555555;
        }
        .value {
          margin-left: 5px;
          color: #333333;
        }
        .footer {
          margin-top: 30px;
          font-size: 13px;
          color: #888888;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">Add-On Status Update</div>

        <p>This is an automated notification from the system. The status of a guest's add-on request has been updated.</p>

        <div class="section">
          <span class="label">Guest Name:</span><span class="value">${guestName}</span>
        </div>

        <div class="section">
          <span class="label">Requested Add-on:</span>
          <p class="value">${addon}</p>
        </div>

        <div class="section">
          <span class="label">Status:</span><span class="value">${status}</span>
        </div>

        <p>Please take note of the updated status and proceed accordingly.</p>

        <div class="footer">
          &copy; ${companyName} | All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = { getAddonRequestEmail, addOnStatusUpdateEmail };
