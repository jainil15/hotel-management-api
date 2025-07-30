const { default: mongoose } = require("mongoose");
const {
  ValidationError,
  APIError,
  InternalServerError,
  ConflictError,
  NotFoundError,
} = require("../lib/CustomErrors");
const {
  CreateCheckInOutRequestValidationSchema,
  UpdateRequestStatusValidationSchema,
} = require("../models/checkInOutRequest.model");
const messageTemplateService = require("../services/messageTemplate.service");
const messageService = require("../services/message.service");
const guestStatusService = require("../services/guestStatus.service");
const checkInOutRequestService = require("../services/checkInOutRequest.service");
const guestService = require("../services/guest.service");
const propertyService = require("../services/property.service");
const twilioAccountService = require("../services/twilioAccount.service");
const twilioService = require("../services/twilio.service");
const settingService = require("../services/setting.service");
const chatListService = require("../services/chatList.service");
const { REQUEST_STATUS } = require("../constants/guestStatus.contant");
const { appendRowToSheet } = require("../services/googleSheets.service");
const smsService = require("../services/sms.service");
const guestSessionService = require("../services/guestSession.service");
const {
  messageTriggerType,
  requestType,
  messageType,
} = require("../constants/message.constant");
const { modifyMessageTemplateBody } = require("../utils/messageTemplateUpdate");
const { responseHandler } = require("../middlewares/response.middleware");
const { compareDateGt } = require("../utils/dateCompare");
const { z } = require("zod");
const {
  validateUpdate,
  validateUpdatev3,
} = require("../utils/guestStatus.util");
const {
  guestStatusToTemplate,
  guestStatusToTemplateOnUpdate,
} = require("../utils/guestStatustToTemplate");
const { addOnStatusUpdateEmail } = require("../utils/addOnEmailTemplate");
const { sendMail } = require("../utils/mail.util");

const contactUs = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      hotelName,
      propertyType,
      message,
    } = req.body;

    const clienthtml = `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Thank you for contacting us</title>
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
          <div class="header">Request Received</div>

          <p>This is an automated notification from the system.</p>

          <div class="section">
            <span class="label">Name:</span><span class="value">${firstName}  ${lastName}</span>
          </div>

          <div class="section">
            <span class="label">Property:</span>
            <p class="value">${hotelName}</p>
          </div>

          <div class="section">
            <span class="label">Property Type:</span>
            <p class="value">${propertyType}</p>
          </div>

          <p>Our team will get back to you soon.</p>

          <div class="footer">
            &copy; Onelyk | All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;
    const companyHtml = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>New Demo Enquiry</title>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f9fafb; padding: 20px; }
        .container { background: #fff; padding: 20px; border: 1px solid #eee; border-radius: 8px; }
        .title { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
        .row { margin-bottom: 8px; }
        .label { font-weight: bold; display: inline-block; width: 120px; }
        .value { display: inline-block; color: #333; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="title">New Demo Request Received</div>
        <div class="row"><span class="label">Name:</span><span class="value">${firstName} ${lastName}</span></div>
        <div class="row"><span class="label">Email:</span><span class="value">${email}</span></div>
        <div class="row"><span class="label">Phone:</span><span class="value">${phone}</span></div>
        <div class="row"><span class="label">Hotel:</span><span class="value">${hotelName}</span></div>
        <div class="row"><span class="label">Property Type:</span><span class="value">${propertyType}</span></div>
        <div class="row"><span class="label">Message:</span><span class="value">${message || "N/A"}</span></div>
      </div>
    </body>
    </html>`;
    const companyEmail = "ravi.parmar@onelyk.com";
    Promise.all([
      appendRowToSheet("ContactUs", [
        firstName,
        lastName,
        email,
        phone,
        hotelName,
        propertyType,
        message,
      ]),
      sendMail(email, "Thank you for contacting us", clienthtml),
      sendMail(
        companyEmail,
        "New Demo Request from Onelyk Website",
        companyHtml,
      ),
    ]);

    return responseHandler(res, {});
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

const bookDemo = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phoneCountryCode,
      phone,
      hotelName,
      propertyType,
      address,
      city,
      state,
      zipCode,
      country,
      roomCount,
      currentSystem,
      preferredDate,
      preferredTime,
      timezone,
      additionalNotes,
    } = req.body;
    const clienthtml = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Thank you for contacting us</title>
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
        <div class="header">Request Received</div>
    
        <p>This is an automated notification from the system.</p>
    
        <div class="section">
          <span class="label">Name:</span><span class="value">${firstName} ${lastName}</span>
        </div>
    
        <div class="section">
          <span class="label">Email:</span><span class="value">${email}</span>
        </div>
    
        <div class="section">
          <span class="label">Phone:</span><span class="value">${phoneCountryCode} ${phone}</span>
        </div>
    
        <div class="section">
          <span class="label">Hotel Name:</span><span class="value">${hotelName}</span>
        </div>
    
        <div class="section">
          <span class="label">Property Type:</span><span class="value">${propertyType}</span>
        </div>
    
        <div class="section">
          <span class="label">Address:</span><span class="value">${address || "N/A"}</span>
        </div>
    
        <div class="section">
          <span class="label">City:</span><span class="value">${city || "N/A"}</span>
        </div>
    
        <div class="section">
          <span class="label">State:</span><span class="value">${state || "N/A"}</span>
        </div>
    
        <div class="section">
          <span class="label">Zip Code:</span><span class="value">${zipCode || "N/A"}</span>
        </div>
    
        <div class="section">
          <span class="label">Country:</span><span class="value">${country || "N/A"}</span>
        </div>
    
        <div class="section">
          <span class="label">Room Count:</span><span class="value">${roomCount}</span>
        </div>
    
        <div class="section">
          <span class="label">Current System:</span><span class="value">${currentSystem || "N/A"}</span>
        </div>
    
        <div class="section">
          <span class="label">Preferred Date:</span><span class="value">${preferredDate}</span>
        </div>
    
        <div class="section">
          <span class="label">Preferred Time:</span><span class="value">${preferredTime}</span>
        </div>
    
        <div class="section">
          <span class="label">Timezone:</span><span class="value">${timezone}</span>
        </div>
    
        <div class="section">
          <span class="label">Additional Notes:</span><span class="value">${additionalNotes || "None"}</span>
        </div>
    
        <p>Our team will get back to you soon.</p>
    
        <div class="footer">
          &copy; Onelyk | All rights reserved.
        </div>
      </div>
    </body>
    </html>`;
    const companyHtml = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>New Demo Enquiry</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f9fafb;
          padding: 20px;
        }
        .container {
          background: #fff;
          padding: 20px;
          border: 1px solid #eee;
          border-radius: 8px;
          max-width: 700px;
          margin: auto;
        }
        .title {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 20px;
        }
        .row {
          margin-bottom: 10px;
        }
        .label {
          font-weight: bold;
          display: inline-block;
          width: 160px;
          color: #444;
        }
        .value {
          display: inline-block;
          color: #222;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="title">New Demo Request Received</div>
    
        <div class="row"><span class="label">Name:</span><span class="value">${firstName} ${lastName}</span></div>
        <div class="row"><span class="label">Email:</span><span class="value">${email}</span></div>
        <div class="row"><span class="label">Phone:</span><span class="value">${phoneCountryCode} ${phone}</span></div>
        <div class="row"><span class="label">Hotel Name:</span><span class="value">${hotelName}</span></div>
        <div class="row"><span class="label">Property Type:</span><span class="value">${propertyType}</span></div>
        <div class="row"><span class="label">Room Count:</span><span class="value">${roomCount}</span></div>
        <div class="row"><span class="label">Current System:</span><span class="value">${currentSystem || "N/A"}</span></div>
        <div class="row"><span class="label">Address:</span><span class="value">${address || "N/A"}</span></div>
        <div class="row"><span class="label">City:</span><span class="value">${city || "N/A"}</span></div>
        <div class="row"><span class="label">State:</span><span class="value">${state || "N/A"}</span></div>
        <div class="row"><span class="label">Zip Code:</span><span class="value">${zipCode || "N/A"}</span></div>
        <div class="row"><span class="label">Country:</span><span class="value">${country || "N/A"}</span></div>
        <div class="row"><span class="label">Preferred Date:</span><span class="value">${preferredDate}</span></div>
        <div class="row"><span class="label">Preferred Time:</span><span class="value">${preferredTime}</span></div>
        <div class="row"><span class="label">Timezone:</span><span class="value">${timezone}</span></div>
        <div class="row"><span class="label">Additional Notes:</span><span class="value">${additionalNotes || "None"}</span></div>
    
      </div>
    </body>
    </html>`;

    const companyEmail = "ravi.parmar@onelyk.com"; // Replace with your company email

    await Promise.all([
      appendRowToSheet("BookDemo", [
        firstName,
        lastName,
        email,
        phoneCountryCode,
        phone,
        hotelName,
        propertyType,
        address,
        city,
        state,
        zipCode,
        country,
        roomCount,
        currentSystem,
        preferredDate,
        preferredTime,
        timezone,
        additionalNotes,
      ]),
      sendMail(email, "Thank you for contacting us", clienthtml),
      sendMail(
        companyEmail,
        `New Demo Request from ${firstName} ${lastName}`,
        companyHtml,
      ),
    ]);
    return responseHandler(res, {});
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

const requestTrial = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phoneCountryCode,
      phone,
      hotelName,
      propertyType,
      roomCount,
      currentSystem,
      primaryGoal,
    } = req.body;

    // Client Email HTML
    const clientHtml = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Thank you for requesting a trial</title>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px; }
        .container {
          background-color: #ffffff;
          padding: 30px;
          max-width: 600px;
          margin: auto;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
        }
        .header { font-size: 20px; color: #333333; margin-bottom: 20px; font-weight: bold; }
        .section { margin-bottom: 15px; }
        .label { font-weight: bold; color: #555555; }
        .value { margin-left: 5px; color: #333333; }
        .footer { margin-top: 30px; font-size: 13px; color: #888888; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">Trial Request Received</div>
        <p>This is an automated notification from the system.</p>

        <div class="section"><span class="label">Name:</span><span class="value">${firstName} ${lastName}</span></div>
        <div class="section"><span class="label">Email:</span><span class="value">${email}</span></div>
        <div class="section"><span class="label">Phone:</span><span class="value">${phoneCountryCode} ${phone}</span></div>
        <div class="section"><span class="label">Hotel Name:</span><span class="value">${hotelName}</span></div>
        <div class="section"><span class="label">Property Type:</span><span class="value">${propertyType}</span></div>
        <div class="section"><span class="label">Room Count:</span><span class="value">${roomCount}</span></div>
        <div class="section"><span class="label">Current System:</span><span class="value">${currentSystem}</span></div>
        <div class="section"><span class="label">Primary Goal:</span><span class="value">${primaryGoal || "N/A"}</span></div>

        <p>Our team will be in touch with you shortly.</p>

        <div class="footer">&copy; Onelyk | All rights reserved.</div>
      </div>
    </body>
    </html>`;

    // Company Email HTML
    const companyHtml = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>New Trial Request</title>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f9fafb; padding: 20px; }
        .container {
          background: #fff;
          padding: 20px;
          border: 1px solid #eee;
          border-radius: 8px;
          max-width: 700px;
          margin: auto;
        }
        .title { font-size: 20px; font-weight: bold; margin-bottom: 20px; }
        .row { margin-bottom: 10px; }
        .label { font-weight: bold; display: inline-block; width: 160px; color: #444; }
        .value { display: inline-block; color: #222; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="title">New Trial Request Received</div>

        <div class="row"><span class="label">Name:</span><span class="value">${firstName} ${lastName}</span></div>
        <div class="row"><span class="label">Email:</span><span class="value">${email}</span></div>
        <div class="row"><span class="label">Phone:</span><span class="value">${phoneCountryCode} ${phone}</span></div>
        <div class="row"><span class="label">Hotel Name:</span><span class="value">${hotelName}</span></div>
        <div class="row"><span class="label">Property Type:</span><span class="value">${propertyType}</span></div>
        <div class="row"><span class="label">Room Count:</span><span class="value">${roomCount}</span></div>
        <div class="row"><span class="label">Current System:</span><span class="value">${currentSystem}</span></div>
        <div class="row"><span class="label">Primary Goal:</span><span class="value">${primaryGoal || "N/A"}</span></div>

      </div>
    </body>
    </html>`;

    const companyEmail = "ravi.parmar@onelyk.com";

    await Promise.all([
      appendRowToSheet("TrialRequest", [
        firstName,
        lastName,
        email,
        phoneCountryCode,
        phone,
        hotelName,
        propertyType,
        roomCount,
        currentSystem,
        primaryGoal,
      ]),
      sendMail(
        companyEmail,
        `New Trial Request from ${firstName} ${lastName}`,
        companyHtml,
      ),
      sendMail(email, "Thank you for requesting a trial", clientHtml),
    ]);

    return responseHandler(res, {
      message: "Trial request submitted successfully",
    });
  } catch (e) {
    if (e instanceof APIError) return next(e);
    return next(new InternalServerError(e.message));
  }
};

module.exports = {
  contactUs,
  bookDemo,
  requestTrial,
};
