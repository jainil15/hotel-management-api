const { Router } = require("express");
const router = Router();

const {
  getPhoneNumbers,
  buyPhoneNumber,
  createSubaccount,
} = require("../controllers/twilio.controller");
const { authenticateToken } = require("../middlewares/jwt.middleware");
const {
  checkPropertyAccess,
  checkPermissions,
} = require("../middlewares/propertyaccess.middleware");

router.get("/phoneNumbers", authenticateToken, getPhoneNumbers);
router.post(
  "/:propertyId/createSubaccount",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions("admin"),
  createSubaccount
);
router.post(
  "/:propertyId/buyPhoneNumber",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions("admin"),
  buyPhoneNumber
);

module.exports = router;
