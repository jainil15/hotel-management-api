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

router.get(
	"/:propertyId/:guestId",
	authenticateToken,
	checkPropertyAccess,
	checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
	messageController.getAll,
);

router.post("/status", status);
module.exports = router;
