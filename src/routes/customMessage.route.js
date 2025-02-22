const router = require("express").Router();
const { ROLE } = require("../constants/role.constant");
const customMessageController = require("../controllers/customMessage.controller")
const { authenticateToken } = require("../middlewares/jwt.middleware");
const {
  checkPropertyAccess,
  checkPermissions,
} = require("../middlewares/propertyaccess.middleware");

router.post(
  "/:propertyId",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
  customMessageController.sendCustomMessage,
);
module.exports = router;
