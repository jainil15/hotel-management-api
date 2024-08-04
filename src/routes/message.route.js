// Temp code
const { Router } = require("express");
const messageController = require("../controllers/message.controller");
const {
	sendsms,
	incomingMessage,
	status,
} = require("../controllers/message.controller");
const {
	checkPermissions,
	checkPropertyAccess,
} = require("../middlewares/propertyaccess.middleware");
const { authenticateToken } = require("../middlewares/jwt.middleware");
const { TwilioAccount } = require("../models/twilioAccount.model");
const twilio = require("twilio");
const { ROLE } = require("../constants/role.constant");
const router = Router();

router.post(
	"/:propertyId/:guestId",
	authenticateToken,
	checkPropertyAccess,
	checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
	sendsms,
);
router.post("/incoming-message", incomingMessage);
// router.post("/error-logging", incomingMessage);
// router.post("/sendsmstest", async (req, res, next) => {
//   const twilioAccount = await TwilioAccount.findById("6698cccc3bfa38a274593da5");
//   const twilioClient = twilio(
//     process.env.TWILIO_ACCOUNT_SID,
//     process.env.TWILIO_AUTH_TOKEN,
//     { accountSid: twilioAccount.sid }
//   );

//   const sentMessage = await twilioClient.messages.create({
//     body: "Hello From Onelyk Subaccount",
//     from: twilioAccount.phoneNumber,
//     to: "+13177242610",
//   });
//   res.status(200).json({ result: { message: sentMessage } });
// });
router.get(
	"/:propertyId/:guestId",
	authenticateToken,
	checkPropertyAccess,
	checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
	messageController.getAll,
);

router.post("/status", status);
module.exports = router;
