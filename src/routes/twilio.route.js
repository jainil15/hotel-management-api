const { Router } = require("express");
const router = Router();

const {
  getPhoneNumbers,
  buyPhoneNumber,
  createSubaccount,
  getTollFreeVerificationStatus,
} = require("../controllers/twilio.controller");
const { authenticateToken } = require("../middlewares/jwt.middleware");
const {
  checkPropertyAccess,
  checkPermissions,
} = require("../middlewares/propertyaccess.middleware");

// Twilio Routes
// Get Phone Numbers
router.get("/phoneNumbers", authenticateToken, getPhoneNumbers);

router.post(
  "/:propertyId/createSubaccount",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions("admin"),
  createSubaccount,
);

router.post(
  "/:propertyId/buyPhoneNumber",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions("admin"),
  buyPhoneNumber,
);

router.get(
  "/:propertyId/tollFreeVerificationStatus",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions("admin"),
  getTollFreeVerificationStatus,
);

module.exports = router;
