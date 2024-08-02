const { Router } = require("express");
const {
  create,
  update,
  getByGuestId,
} = require("../controllers/guestStatus.controller.js");
const { authenticateToken } = require("../middlewares/jwt.middleware.js");
const {
  checkPropertyAccess,
  checkPermissions,
} = require("../middlewares/propertyaccess.middleware.js");
const { ROLE } = require("../constants/role.constant.js");
const {
  checkGuestAccess,
} = require("../middlewares/guestAccess.middleware.js");

// Router
const router = Router();

// create guest status -- useless
router.post(
  "/:propertyId/:guestId",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
  create
);

// get guest status by guest id, perms: admin, frontdesk, guest, guestaccess enabled
router.get(
  "/:propertyId/:guestId",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK, ROLE.GUEST]),
  checkGuestAccess,
  getByGuestId
);

// update guest status, perms: admin, frontdesk
router.put(
  "/:propertyId/:guestId",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK, ROLE.GUEST]),
  checkGuestAccess,
  update
);

module.exports = router;
