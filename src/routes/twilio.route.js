const { Router } = require("express");
const router = Router();
const twilioController = require("../controllers/twilio.controller");
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
const { ROLE } = require("../constants/role.constant");

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
  checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
  getTollFreeVerificationStatus,
);
router.get(
  "/:propertyId/isTwilioSetup",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
  twilioController.isTwilioSetup,
);
router.get(
  "/:propertyId/billing",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
  twilioController.subaccountBilling,
);

module.exports = router;
