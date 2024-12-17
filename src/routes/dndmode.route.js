const router = require("express").Router();

const { ROLE } = require("../constants/role.constant");
const dndmodeRequestController = require("../controllers/dndmode.controller");

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
  dndmodeRequestController.getdndmodeRequestStatus,
);

router.put(
  "/:propertyId/:guestId/:dndModeRequestId",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions([ROLE.GUEST, ROLE.ADMIN, ROLE.FRONTDESK]),
  dndmodeRequestController.update,
);

module.exports = router;
