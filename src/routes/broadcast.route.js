const router = require("express").Router();
const { authenticateToken } = require("../middlewares/jwt.middleware");
const { ROLE } = require("../constants/role.constant");
const {
	checkPropertyAccess,
	checkPermissions,
} = require("../middlewares/propertyaccess.middleware");
const broadcastController = require("../controllers/broadcast.controller");

router.post(
	"/:propertyId",
	authenticateToken,
	checkPropertyAccess,
	checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
	broadcastController.create,
);
router.post(
	"/:propertyId/doveryting",
	authenticateToken,
	checkPropertyAccess,
	checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
	broadcastController.doeverything,
);

router.put(
	"/:propertyId/:broadcastId/send",
	authenticateToken,
	checkPropertyAccess,
	checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
	broadcastController.sendMessage,
);

router.get(
	"/:propertyId/:broadcastId",
	authenticateToken,
	checkPropertyAccess,
	checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
	broadcastController.getById,
);

router.get(
	"/:propertyId",
	authenticateToken,
	checkPropertyAccess,
	checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
	broadcastController.getAllByPropertyId,
);

module.exports = router;
