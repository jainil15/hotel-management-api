const router = require("express").Router();
const twilio = require("twilio");
const { ROLE } = require("../constants/role.constant");
const smsController = require("../controllers/sms.controller");
const { authenticateToken } = require("../middlewares/jwt.middleware");
const {
	checkPermissions,
	checkPropertyAccess,
} = require("../middlewares/propertyaccess.middleware");
const twilioAuth = require("../middlewares/twilio.middleware");

router.post(
	"/send/:propertyId/:guestId",
	authenticateToken,
	checkPropertyAccess,
	checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
	smsController.send,
);

router.post("/sms-status", twilioAuth, smsController.status);

module.exports = router;
