const { Router } = require("express");
const {
  create,
  getAll,
  getById,
  update,
  remove,
  getAllGuestsWithStatus,
  getGuestById,
} = require("../controllers/guest.controller");

const { authenticateToken } = require("../middlewares/jwt.middleware");
const {
  checkPropertyAccess,
  checkPermissions,
} = require("../middlewares/propertyaccess.middleware");
const { ROLE } = require("../constants/role.constant");
const { checkGuestAccess } = require("../middlewares/guestAccess.middleware");
const router = Router();

router.get("/getByGuestId/:guestId", getGuestById);
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
  getAllGuestsWithStatus,
);

router.get(
  "/:propertyId/:guestId",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK, ROLE.GUEST]),
  checkGuestAccess,
  getById,
);
router.put(
  "/:propertyId/:guestId",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
  update,
);
router.delete(
  "/:propertyId/:guestId",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
  remove,
);

module.exports = router;
