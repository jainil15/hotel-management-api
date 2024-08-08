const { Router } = require("express");

const router = Router();

const {
	create,
	getAll,
	getById,
	update,
	remove,
	updateAll,
} = require("../controllers/messageTemplate.controller");
const { authenticateToken } = require("../middlewares/jwt.middleware");
const {
	checkPermissions,
	checkPropertyAccess,
} = require("../middlewares/propertyaccess.middleware");
const { ROLE } = require("../constants/role.constant");
const messageTemplateController = require("../controllers/messageTemplate.controller");

router.post(
	"/:propertyId",
	authenticateToken,
	checkPropertyAccess,
	checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
	create,
);

router.get(
	"/:propertyId",
	authenticateToken,
	checkPropertyAccess,
	checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
	getAll,
);

router.post(
	"/:propertyId/createStatus",
	authenticateToken,
	checkPropertyAccess,
	checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
	messageTemplateController.getMessageTemplateByStatusForCreate,
);

router.get(
	"/:propertyId/:messageTemplateId",
	authenticateToken,
	checkPropertyAccess,
	checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
	getById,
);
router.put(
	"/:propertyId/:messageTemplateId",
	authenticateToken,
	checkPropertyAccess,
	checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
	update,
);
router.delete(
	"/:propertyId/:messageTemplateId",
	authenticateToken,
	checkPropertyAccess,
	checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
	remove,
);

router.put(
	"/:propertyId",
	authenticateToken,
	checkPropertyAccess,
	checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
	updateAll,
);

router.post(
	"/:propertyId/default",
	authenticateToken,
	checkPropertyAccess,
	checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
	messageTemplateController.createAllDefaultTemplates,
);


router.post(
	"/:propertyId/:guestId/updateStatus",
	authenticateToken,
	checkPropertyAccess,
	checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
	messageTemplateController.getMessageTemplateByStatusForUpdate,
);

module.exports = router;
