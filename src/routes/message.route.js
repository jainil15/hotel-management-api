// Temp code
const { Router } = require("express");
const {
  sendsms,
  incomingMessage,
  status,
} = require("../controllers/message.controller");
const {
  checkPermissions,
  checkPropertyAccess,
} = require("../middlewares/propertyaccess.middleware");
const { authenticateToken } = require("../middlewares/jwt.middleware");

const router = Router();

router.post(
  "/:propertyId/:guestId",
  authenticateToken,
  checkPropertyAccess,
  sendsms
);
router.post("/incoming-message", incomingMessage);
// router.post("/error-logging", incomingMessage);
router.post("/status", status);
module.exports = router;
