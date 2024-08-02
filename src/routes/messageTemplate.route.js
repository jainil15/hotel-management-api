const { Router } = require("express");

const router = Router();

const {
  create,
  getAll,
  getById,
  update,
  remove,
  updateAll,
} = require("../controllers/messageTemplate.controller");
const { authenticateToken } = require("../middlewares/jwt.middleware");
const {
  checkPermissions,
  checkPropertyAccess,
} = require("../middlewares/propertyaccess.middleware");
const { ROLE } = require("../constants/role.constant");

router.post(
  "/:propertyId",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
  create
);
router.get(
  "/:propertyId",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
  getAll
);
router.get(
  "/:propertyId/:messageTemplateId",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
  getById
);
router.put(
  "/:propertyId/:messageTemplateId",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
  update
);
router.delete(
  "/:propertyId/:messageTemplateId",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
  remove
);

router.put(
  "/:propertyId",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
  updateAll
);

module.exports = router;
