const workflowController = require("../controllers/workflow.controller");
const { authenticateToken } = require("../middlewares/jwt.middleware");
const { ROLE } = require("../constants/role.constant");
const {
  checkPropertyAccess,
  checkPermissions,
} = require("../middlewares/propertyaccess.middleware");
const multer = require("multer");
const upload = multer().any();
const router = require("express").Router();

router.post(
  "/:propertyId",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
  workflowController.createDefaults,
);

router.put(
  "/:propertyId",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
  upload,
  workflowController.update,
);

router.delete(
  "/:propertyId",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
  workflowController.removeDefaults,
);

router.get(
  "/:propertyId",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
  workflowController.getByPropertyId,
);

router.post(
  "/default/:propertyId/houseService",
  workflowController.createDefaultHouseKeepingFlow,
);

router.post(
  "/default/:propertyId/upgradeRoom",
  workflowController.createDefaultUpgradeRoomFlow,
);

module.exports = router;
