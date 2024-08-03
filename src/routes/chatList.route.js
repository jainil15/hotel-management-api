const chatListController = require("../controllers/chatList.controller");
const { authenticateToken } = require("../middlewares/jwt.middleware");
const {
	checkPropertyAccess,
	checkPermissions,
} = require("../middlewares/propertyaccess.middleware");
const { ROLE } = require("../constants/role.constant");
const router = require("express").Router();

router.get(
	"/:propertyId",
	authenticateToken,
	checkPropertyAccess,
	checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
	chatListController.getAllByPropertyId,
);
router.put(
	"/:propertyId/:guestId",
	authenticateToken,
	checkPropertyAccess,
	checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
	chatListController.update,
);
router.post(
	"/:propertyId/:guestId",
	authenticateToken,
	checkPropertyAccess,
	checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
	chatListController.create,
);
router.delete(
	"/:propertyId/:guestId",
	authenticateToken,
	checkPropertyAccess,
	checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
	chatListController.remove,
);

module.exports = router;