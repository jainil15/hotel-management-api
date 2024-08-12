const router = require("express").Router();
const { ROLE } = require("../constants/role.constant");
const settingController = require("../controllers/setting.controller");
const { authenticateToken } = require("../middlewares/jwt.middleware");
const {
	checkPropertyAccess,
	checkPermissions,
} = require("../middlewares/propertyaccess.middleware");

router.get(
	"/:propertyId",
	authenticateToken,
	checkPropertyAccess,
	checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
	settingController.getByPropertyId,
);

module.exports = router;
