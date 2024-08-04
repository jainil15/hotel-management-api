const router = require("express").Router();

const { ROLE } = require("../constants/role.constant");
const smsController = require("../controllers/sms.controller");
const { authenticateToken } = require("../middlewares/jwt.middleware");
const {
	checkPermissions,
	checkPropertyAccess,
} = require("../middlewares/propertyaccess.middleware");

router.post(
	"/send/:propertyId/:guestId",
	authenticateToken,
	checkPropertyAccess,
	checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
	smsController.send,
);

module.exports = router;
