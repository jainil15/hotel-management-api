# Twilio SMS Integration

This document explains how Twilio SMS is integrated into the backend, which APIs are used, where they are implemented, and the request/response structure for each. This is a reference for developers working with SMS features in this project.

---

## Overview

- The project uses the official [Twilio Node.js SDK](https://www.twilio.com/docs/libraries/node) to send and receive SMS.
- Twilio is used for:
  - Sending SMS to guests
  - Receiving SMS from guests (webhook)
  - Handling SMS status callbacks (webhook)
  - Managing phone numbers and subaccounts for properties

---

## Key Files

- **Routes:**  
  - `src/routes/sms.route.js` (main SMS endpoints)
  - `src/routes/twilio.route.js` (Twilio account/number management)
- **Controllers:**  
  - `src/controllers/sms.controller.js` (send/receive/status logic)
  - `src/controllers/twilio.controller.js` (Twilio account/number logic)
- **Services:**  
  - `src/services/twilio.service.js` (Twilio API calls)
- **Middleware:**  
  - `src/middlewares/twilio.middleware.js` (validates Twilio webhook requests)

---

## Main Endpoints

### 1. **Send SMS**

- **Endpoint:** `POST /sms/send/:propertyId/:guestId`
- **Auth:** Requires authentication, property access, and permissions.
- **Request Body:**
  ```json
  {
    "body": "Your message text here"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Message sent successfully"
  }
  ```
- **Logic:**  
  - Looks up the Twilio account for the property and the guest's phone number.
  - Uses Twilio SDK to send the SMS.
  - Saves the message in the database and updates chat lists.
  - Emits real-time updates via Socket.io.

---

### 2. **Receive SMS (Webhook from Twilio)**

- **Endpoint:** `POST /sms/receive`
- **Auth:** Validated by `twilioAuthV2` middleware (checks Twilio signature).
- **Request Body:** (sent by Twilio)
  ```
  {
    "From": "+1234567890",
    "To": "+1098765432",
    "Body": "Guest reply text",
    "MessageSid": "SMxxxxxxxxxxxxxxxx"
    // ...other Twilio fields
  }
  ```
- **Response:**
  ```json
  {
    "message": "Message received successfully"
  }
  ```
- **Logic:**  
  - Finds the property and guest by phone number.
  - Saves the incoming message in the database.
  - Updates chat lists and emits real-time updates.

---

### 3. **SMS Status Callback (Webhook from Twilio)**

- **Endpoint:** `POST /sms/sms-status`
- **Auth:** Validated by `twilioAuthV2` middleware.
- **Request Body:** (sent by Twilio)
  ```
  {
    "MessageSid": "SMxxxxxxxxxxxxxxxx",
    "SmsStatus": "delivered"
    // ...other Twilio fields
  }
  ```
- **Response:**
  ```json
  {
    "message": "Status received"
  }
  ```
- **Logic:**  
  - Updates the message status in the database.

---

### 4. **Twilio Account & Number Management**

- **Endpoints:** (all require authentication and admin permissions)
  - `GET /twilio/phoneNumbers?country=US` — List available phone numbers
  - `POST /twilio/:propertyId/buyPhoneNumber` — Buy a phone number for a property
  - `POST /twilio/:propertyId/createSubaccount` — Create a Twilio subaccount for a property
  - `GET /twilio/:propertyId/tollFreeVerificationStatus` — Get toll-free verification status
  - `POST /twilio/:propertyId/resubmitTollFreeVerification` — Resubmit toll-free verification

- **Request/Response:**  
  - Varies by endpoint, but generally expects property info and returns status or Twilio resource data.

---

## Twilio Middleware

- **`twilioAuth` and `twilioAuthV2`** in `src/middlewares/twilio.middleware.js`:
  - Validate incoming webhook requests from Twilio using the `x-twilio-signature` header.
  - Ensure only genuine Twilio requests are processed.

---

## Example: Sending an SMS (Code)

```js
const twilio = require('twilio');
const client = twilio(accountSid, authToken);

client.messages.create({
  body: 'Hello from Onelyk!',
  from: '+1098765432', // Twilio number
  to: '+1234567890',   // Guest number
  statusCallback: process.env.TWILIO_STATUS_CALLBACK
});
```

---

## Where to Look in the Code

- **Sending SMS:**  
  - `src/controllers/sms.controller.js` (`send` function)
  - `src/services/sms.service.js`
- **Receiving SMS:**  
  - `src/controllers/sms.controller.js` (`receive` function)
- **Twilio API Calls:**  
  - `src/services/twilio.service.js`
- **Webhook Validation:**  
  - `src/middlewares/twilio.middleware.js`

---

## Notes

- All phone numbers are managed per property via Twilio subaccounts.
- All SMS activity is logged in the database and linked to guests/properties.
- Real-time updates are sent via Socket.io for chat/message features.

---

**For more details, see the code in the files listed above. If you need to extend or debug Twilio integration, follow the established patterns.** 