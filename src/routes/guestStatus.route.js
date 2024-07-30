const { Router } = require("express");
const { create, update, getByGuestId } = require("../controllers/guestStatus.controller.js");
const { authenticateToken } = require("../middlewares/jwt.middleware.js");
const {
  checkPropertyAccess,
} = require("../middlewares/propertyaccess.middleware.js");

const router = Router();

router.post(
  "/:propertyId/:guestId",
  authenticateToken,
  checkPropertyAccess,
  create
);

router.get(
  "/:propertyId/:guestId",
  authenticateToken,
  checkPropertyAccess,
  getByGuestId
);

router.put(
  "/:propertyId/:guestId",
  authenticateToken,
  checkPropertyAccess,
  update
);

module.exports = router;
