const router = require("express").Router();
const { ROLE } = require("../constants/role.constant");
const flowController = require("../controllers/flow.controller");
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
  flowController.create,
);

router.get(
  "/:propertyId",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
  flowController.getCustomFlow,
);

router.put(
  "/:propertyId",
    authenticateToken,
    checkPropertyAccess,
    checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
    flowController.update,
)

module.exports = router;
