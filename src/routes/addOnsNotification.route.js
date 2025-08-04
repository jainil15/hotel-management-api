const router = require("express").Router();
const { ROLE } = require("../constants/role.constant");
const addOnsNotificationController = require("../controllers/addOnNotification.controller");
const {
  checkPermissions,
  checkPropertyAccess,
} = require("../middlewares/propertyaccess.middleware");
const { authenticateToken } = require("../middlewares/jwt.middleware");

router.put(
  "/:propertyId",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
  addOnsNotificationController.update,
);
router.get(
  "/:propertyId",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
  addOnsNotificationController.getForUpdate,
);

module.exports = router;
