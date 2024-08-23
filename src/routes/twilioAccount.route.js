const router = require("express").Router();

const { ROLE } = require("../constants/role.constant");
const twilioAccountService = require("../controllers/twilioAccount.controller");
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
  twilioAccountService.getByPropertyId,
);

module.exports = router;
