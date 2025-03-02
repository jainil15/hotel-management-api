const analyticsController = require("../controllers/analytics.controller");
const router = require("express").Router();

const { authenticateToken } = require("../middlewares/jwt.middleware");
const {
  checkPropertyAccess,
  checkPermissions,
} = require("../middlewares/propertyaccess.middleware");
const { ROLE } = require("../constants/role.constant");

router.get(
  "/:propertyId",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
  analyticsController.getAnalytics,
);
router.get(
  "/:propertyId/qrCodeScans",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
  analyticsController.getQrCodeScannedPerRoom,
);

module.exports = router;
