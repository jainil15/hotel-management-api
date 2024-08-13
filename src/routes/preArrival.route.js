const router = require("express").Router();

const { ROLE } = require("../constants/role.constant");
const preArrivalController = require("../controllers/preArrival.controller");
const { checkGuestAccess } = require("../middlewares/guestAccess.middleware");
const { authenticateToken } = require("../middlewares/jwt.middleware");
const {
  checkPropertyAccess,
  checkPermissions,
} = require("../middlewares/propertyaccess.middleware");

router.post(
  "/:propertyId/:guestId",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions([ROLE.GUEST]),
  checkGuestAccess,
  preArrivalController.create,
);

router.get(
  "/:propertyId/:guestId",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions([ROLE.GUEST, ROLE.ADMIN, ROLE.FRONTDESK]),
  checkGuestAccess,
  preArrivalController.getByGuestId,
);

module.exports = router;
