const router = require("express").Router();

const { ROLE } = require("../constants/role.constant");
const checkInOutRequestController = require("../controllers/checkInOutRequest.controller");
const { checkGuestAccess } = require("../middlewares/guestAccess.middleware");
const { authenticateToken } = require("../middlewares/jwt.middleware");
const {
	checkPropertyAccess,
	checkPermissions,
} = require("../middlewares/propertyaccess.middleware");

router.post(
	"/:propertyId/:guestId/",
	authenticateToken,
	checkPropertyAccess,
	checkPermissions([ROLE.GUEST, ROLE.ADMIN, ROLE.FRONTDESK]),
	checkGuestAccess,
	checkInOutRequestController.create,
);
router.patch(
	"/:propertyId/:guestId/:checkInOutRequestId",
	authenticateToken,
	checkPropertyAccess,
	checkPermissions([ROLE.GUEST, ROLE.ADMIN, ROLE.FRONTDESK]),
	checkGuestAccess,
	checkInOutRequestController.updateRequestStatus,
);

router.get(
	"/:propertyId/:guestId",
	authenticateToken,
	checkPropertyAccess,
	checkPermissions([ROLE.GUEST, ROLE.ADMIN, ROLE.FRONTDESK]),
	checkGuestAccess,
	checkInOutRequestController.getAll,
);

router.get(
	"/:propertyId/:guestId/requestType",
	authenticateToken,
	checkPropertyAccess,
	checkPermissions([ROLE.GUEST, ROLE.ADMIN, ROLE.FRONTDESK]),
	checkGuestAccess,
	checkInOutRequestController.getByRequestType,
);

router.get(
	"/:propertyId/:guestId/:checkInOutRequestId",
	authenticateToken,
	checkPropertyAccess,
	checkPermissions([ROLE.GUEST, ROLE.ADMIN, ROLE.FRONTDESK]),
	checkGuestAccess,
	checkInOutRequestController.getById,
);

module.exports = router;
