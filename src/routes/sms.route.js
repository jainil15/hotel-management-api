const router = require("express").Router();
const twilio = require("twilio");
const { ROLE } = require("../constants/role.constant");
const smsController = require("../controllers/sms.controller");
const { authenticateToken } = require("../middlewares/jwt.middleware");
const {
	checkPermissions,
	checkPropertyAccess,
} = require("../middlewares/propertyaccess.middleware");
const {
	twilioAuth,
	twilioAuthV2,
} = require("../middlewares/twilio.middleware");

router.post(
	"/send/:propertyId/:guestId",
	authenticateToken,
	checkPropertyAccess,
	checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
	smsController.send,
);
router.post("/receive", twilioAuthV2, smsController.receive);
router.post("/sms-status", twilioAuth, smsController.status);

module.exports = router;
