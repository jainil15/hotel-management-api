# API Endpoint Documentation

Below is a comprehensive list of all available API endpoints in this backend project. Endpoints are grouped by their route prefix. Most endpoints require authentication and specific roles (admin, frontdesk, guest, etc.).

---

## User Endpoints (`/user`)
- **POST** `/user/register` — Register a new user
- **POST** `/user/login` — Login
- **POST** `/user/logout` — Logout (requires authentication)
- **GET** `/user/` — Get user info (requires authentication)
- **POST** `/user/:propertyId` — Create user for a property (admin only)

## Auth Endpoints (`/auth`)
- **GET** `/auth/accessToken` — Get access token
- **POST** `/auth/verifyOtp` — Verify OTP
- **POST** `/auth/resendOtp` — Resend OTP
- **GET** `/auth/guestAccessToken/:guestId` — Generate guest access token
- **POST** `/auth/refresh-token` — Refresh access token
- **POST** `/auth/guestLogin/:token` — Guest login with token
- **GET** `/auth/isLoggedIn` — Check if logged in (requires authentication)

## Property Endpoints (`/property`)
- **POST** `/property/` — Create property (admin only)
- **GET** `/property/` — Get all properties (admin/frontdesk)
- **GET** `/property/:propertyId` — Get property by ID (admin/frontdesk)
- **PUT** `/property/:propertyId` — Update property (admin/frontdesk)
- **DELETE** `/property/:propertyId` — Delete property (admin/frontdesk)

## Guest Endpoints (`/guest`)
- **GET** `/guest/getByGuestId/:guestId` — Get guest by guestId
- **GET** `/guest/addons/:propertyId` — Get guest add-ons requests (admin/frontdesk)
- **POST** `/guest/:propertyId` — Create guest (admin/frontdesk)
- **GET** `/guest/:propertyId` — Get all guests with status (admin/frontdesk)
- **GET** `/guest/:propertyId/pending` — Get pending check-in/out guests (admin/frontdesk)
- **GET** `/guest/:propertyId/:guestId` — Get guest by ID (admin/frontdesk/guest)
- **PUT** `/guest/:propertyId/:guestId` — Update guest (admin/frontdesk)
- **DELETE** `/guest/:propertyId/:guestId` — Delete guest (admin/frontdesk)
- **GET** `/guest/getGuestData/:propertyId/:guestId` — Get combined guest data
- **PATCH** `/guest/guestedit/:propertyId/:guestId` — Edit guest data (admin/frontdesk)
- **DELETE** `/guest/addons/:propertyId/:guestId/:requestId` — Delete add-on request (admin/frontdesk)
- **POST** `/guest/getGuestByPhoneNumber/:propertyId` — Get guest by phone number
- **POST** `/guest/guestRegistration/:propertyId` — Guest self-registration
- **PATCH** `/guest/houseKeepingRequest/:propertyId/:guestId/:requestId` — Update housekeeping request
- **POST** `/guest/sendOtp/:propertyId` — Send OTP

## Message Endpoints (`/message`)
- **POST** `/message/:propertyId/:guestId` — Send SMS (admin/frontdesk)
- **POST** `/message/incoming-message` — Incoming message webhook
- **GET** `/message/:propertyId/:guestId` — Get all messages (admin/frontdesk)
- **POST** `/message/status` — Message status webhook

## Analytics Endpoints (`/analytics`)
- **GET** `/analytics/:propertyId` — Get analytics for a property (admin/frontdesk)
- **GET** `/analytics/:propertyId/details` — Get detailed analytics for a property (admin/frontdesk)

## Add-Ons Request Endpoints (`/addOnsRequest`)
- **GET** `/addOnsRequest/:propertyId` — Get all add-ons requests for a property (admin/frontdesk)
- **PUT** `/addOnsRequest/:propertyId/:guestId/:addOnsRequestId` — Update an add-ons request (guest/admin/frontdesk)

## Check-In/Out Request Endpoints (`/checkInOutRequest`)
- **POST** `/checkInOutRequest/:propertyId/:guestId/` — Create a check-in/out request (guest/admin/frontdesk)
- **PATCH** `/checkInOutRequest/:propertyId/:guestId/:checkInOutRequestId` — Update request status (guest/admin/frontdesk)
- **GET** `/checkInOutRequest/:propertyId/:guestId` — Get all check-in/out requests for a guest (guest/admin/frontdesk)
- **GET** `/checkInOutRequest/:propertyId/:guestId/requestType` — Get requests by type (guest/admin/frontdesk)
- **GET** `/checkInOutRequest/:propertyId/:guestId/:checkInOutRequestId` — Get request by ID (guest/admin/frontdesk)

## Guest API Endpoints (`/guestApi/:guestSessionId`)
- **GET** `/guestApi/:guestSessionId/guest` — Get guest with status
- **GET** `/guestApi/:guestSessionId/workflow` — Get workflow
- **GET** `/guestApi/:guestSessionId/property` — Get property
- **GET** `/guestApi/:guestSessionId/settings` — Get settings
- **GET** `/guestApi/:guestSessionId/guest/status` — Get guest status
- **GET** `/guestApi/:guestSessionId/checkInOutRequest` — Get check-in/out requests
- **GET** `/guestApi/:guestSessionId/addOns` — Get add-ons requests
- **GET** `/guestApi/:guestSessionId/dndmodeRequest` — Get DND mode requests
- **POST** `/guestApi/:guestSessionId/checkInOutRequest` — Create check-in/out request
- **POST** `/guestApi/:guestSessionId/preArrival` — Create pre-arrival (with file upload)
- **POST** `/guestApi/:guestSessionId/review` — Create review
- **GET** `/guestApi/:guestSessionId/review` — Get review
- **PATCH** `/guestApi/:guestSessionId/review` — Update review
- **PATCH** `/guestApi/:guestSessionId/complete-review` — Complete review
- **POST** `/guestApi/:guestSessionId/addOnsRequest` — Create add-ons request
- **POST** `/guestApi/:guestSessionId/dndmodeRequest` — Create DND mode request
- **POST** `/guestApi/:guestSessionId/houseKeepingRequest` — Create housekeeping request
- **GET** `/guestApi/:guestSessionId/houseKeepingRequest` — Get housekeeping requests

## Guest Status Endpoints (`/guestStatus`)
- **POST** `/guestStatus/:propertyId/:guestId` — Create guest status (admin/frontdesk)
- **GET** `/guestStatus/:propertyId/:guestId` — Get guest status by guest ID (admin/frontdesk/guest)
- **PUT** `/guestStatus/:propertyId/:guestId` — Update guest status (admin/frontdesk/guest)
- **POST** `/guestStatus/:propertyId/:guestId/request` — Request guest status (no auth, possibly public)

## Twilio Endpoints (`/twilio`)
- **GET** `/twilio/phoneNumbers` — Get phone numbers (admin)
- **POST** `/twilio/:propertyId/createSubaccount` — Create subaccount (admin)
- **POST** `/twilio/:propertyId/buyPhoneNumber` — Buy phone number (admin)
- **GET** `/twilio/:propertyId/tollFreeVerificationStatus` — Get toll-free verification status (admin/frontdesk)
- **GET** `/twilio/:propertyId/isTwilioSetup` — Check if Twilio is setup (admin/frontdesk)
- **GET** `/twilio/:propertyId/billing` — Get subaccount billing
- **POST** `/twilio/:propertyId/resubmitTollFreeVerification` — Resubmit toll-free verification (admin)

## Broadcast Endpoints (`/broadcast`)
- **POST** `/broadcast/:propertyId` — Create broadcast (admin/frontdesk)
- **POST** `/broadcast/:propertyId/createupdatesend` — Create, update, and send broadcast (admin/frontdesk)
- **PUT** `/broadcast/:propertyId/:broadcastId/send` — Send broadcast message (admin/frontdesk)
- **GET** `/broadcast/:propertyId/:broadcastId` — Get broadcast by ID (admin/frontdesk)
- **GET** `/broadcast/:propertyId` — Get all broadcasts for a property (admin/frontdesk)

## Country Endpoints (`/country`)
- **GET** `/country/` — Get all countries
- **GET** `/country/:country/timezones` — Get timezones for a country
- **GET** `/country/:country/states` — Get states for a country
- **GET** `/country/:country/:state/cities` — Get cities for a state in a country
- **GET** `/country/:country/:zipcode` — Get zip code info for a country

## Message Template Endpoints (`/messageTemplate`)
- **POST** `/messageTemplate/:propertyId` — Create message template (admin/frontdesk)
- **GET** `/messageTemplate/:propertyId` — Get all message templates (admin/frontdesk)
- **POST** `/messageTemplate/:propertyId/createStatus` — Get message template by status for create (admin/frontdesk)
- **GET** `/messageTemplate/:propertyId/:messageTemplateId` — Get message template by ID (admin/frontdesk)
- **PUT** `/messageTemplate/:propertyId/:messageTemplateId` — Update message template (admin/frontdesk)
- **DELETE** `/messageTemplate/:propertyId/:messageTemplateId` — Delete message template (admin/frontdesk)
- **PUT** `/messageTemplate/:propertyId` — Update all message templates (admin/frontdesk)
- **POST** `/messageTemplate/:propertyId/default` — Create all default templates (admin/frontdesk)
- **POST** `/messageTemplate/:propertyId/:guestId/updateStatus` — Get message template by status for update (admin/frontdesk)

## SMS Endpoints (`/sms`)
- **POST** `/sms/send/:propertyId/:guestId` — Send SMS (admin/frontdesk)
- **POST** `/sms/receive` — Receive SMS (Twilio webhook)
- **POST** `/sms/sms-status` — SMS status webhook (Twilio)

## ASI PMS Endpoints (`/asiPms`)
- **POST** `/asiPms/folio` — Folio dispatcher
- **POST** `/asiPms/roomStatus` — Room status dispatcher

## Pre-Arrival Endpoints (`/preArrival`)
- **POST** `/preArrival/:propertyId/:guestId` — Create pre-arrival (guest/admin/frontdesk)
- **GET** `/preArrival/:propertyId/:guestId` — Get pre-arrival by guest ID (guest/admin/frontdesk)

## Setting Endpoints (`/setting`)
- **GET** `/setting/:propertyId` — Get settings by property ID (admin/frontdesk)
- **GET** `/setting/guest/:propertyId/` — Get guest settings by property ID

## Pre-Arrival Flow Endpoints (`/preArrivalFlow`)
- **GET** `/preArrivalFlow/:propertyId` — Get pre-arrival flow by property ID (admin/frontdesk)
- **PUT** `/preArrivalFlow/:propertyId` — Update pre-arrival flow (admin/frontdesk)
- **POST** `/preArrivalFlow/:propertyId` — Create default pre-arrival flow (admin/frontdesk)

## Custom Flow Endpoints (`/customFlow`)
- **POST** `/customFlow/:propertyId` — Create custom flow (admin/frontdesk)
- **GET** `/customFlow/:propertyId` — Get custom flow (admin/frontdesk)
- **PUT** `/customFlow/:propertyId` — Update custom flow (admin/frontdesk)

## QR Code Scan Endpoints (`/qrCodeScan`)
- **POST** `/qrCodeScan/:propertyId` — Create QR code scan

## Review Endpoints (`/review`)
- **GET** `/review/:propertyId` — Get all reviews by property ID (admin/frontdesk)

## Reply Endpoints (`/reply`)
- **POST** `/reply/:propertyId` — Create reply (admin/frontdesk)
- **GET** `/reply/property/:propertyId` — Get replies by property ID (admin/frontdesk)
- **GET** `/reply/review/:propertyId/:reviewId` — Get replies by review ID (admin/frontdesk)

## DND Mode Endpoints (`/dndmodeRequest`)
- **GET** `/dndmodeRequest/:propertyId` — Get DND mode request status (admin/frontdesk)
- **PUT** `/dndmodeRequest/:propertyId/:guestId/:dndModeRequestId` — Update DND mode request (guest/admin/frontdesk)

## Workflow Endpoints (`/workflow`)
- **POST** `/workflow/:propertyId` — Create default workflow (admin/frontdesk)
- **PUT** `/workflow/:propertyId` — Update workflow (admin/frontdesk)
- **DELETE** `/workflow/:propertyId` — Remove default workflow (admin/frontdesk)
- **GET** `/workflow/:propertyId` — Get workflow by property ID (admin/frontdesk)
- **POST** `/workflow/default/:propertyId/houseService` — Create default housekeeping flow
- **POST** `/workflow/default/:propertyId/upgradeRoom` — Create default housekeeping flow

## Twilio Account Endpoints (`/twilioAccount`)
- **GET** `/twilioAccount/:propertyId` — Get Twilio account by property ID (admin/frontdesk)

## Chat List Endpoints (`/chatList`)
- **GET** `/chatList/:propertyId` — Get all chat lists by property ID (admin/frontdesk)
- **PUT** `/chatList/:propertyId/:guestId` — Update chat list (admin/frontdesk)
- **POST** `/chatList/:propertyId/:guestId` — Create chat list (admin/frontdesk)
- **DELETE** `/chatList/:propertyId/:guestId` — Remove chat list (admin/frontdesk)

---

**Note:** Most endpoints require authentication and specific roles. Please refer to the codebase for detailed request/response formats and required permissions.
