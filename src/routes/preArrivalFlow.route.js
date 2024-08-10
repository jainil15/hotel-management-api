const { ROLE } = require("../constants/role.constant");
const preArrivalFlowController = require("../controllers/preArrivalFlow.controller");
const { authenticateToken } = require("../middlewares/jwt.middleware");
const {
	checkPropertyAccess,
	checkPermissions,
} = require("../middlewares/propertyaccess.middleware");

const router = require("express").Router();

router.get(
	"/:propertyId",
	authenticateToken,
	checkPropertyAccess,
	checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
	preArrivalFlowController.getByPropertyId,
);

router.put(
	"/:propertyId",
	authenticateToken,
	checkPropertyAccess,
	checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
	preArrivalFlowController.update,
);

module.exports = router;
