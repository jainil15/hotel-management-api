const router = require("express").Router();

const { ROLE } = require("../constants/role.constant");
const addOnsRequestController = require("../controllers/addOnsRequest.controller");

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
  addOnsRequestController.getAllByPropertyId,
);

router.put(
  "/:propertyId/:guestId/:addOnsRequestId",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions([ROLE.GUEST, ROLE.ADMIN, ROLE.FRONTDESK]),
  addOnsRequestController.update,
);

module.exports = router;
