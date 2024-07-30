const { Router } = require("express");

const router = Router();

const {
  create,
  getAll,
  getById,
  update,
  remove,
} = require("../controllers/messageTemplate.controller");
const { authenticateToken } = require("../middlewares/jwt.middleware");
const {
  checkPermissions,
  checkPropertyAccess,
} = require("../middlewares/propertyaccess.middleware");

router.post("/:propertyId", authenticateToken, checkPropertyAccess, create);
router.get("/:propertyId", authenticateToken, checkPropertyAccess, getAll);
router.get(
  "/:propertyId/:messageTemplateId",
  authenticateToken,
  checkPropertyAccess,
  getById
);
router.put(
  "/:propertyId/:messageTemplateId",
  authenticateToken,
  checkPropertyAccess,
  update
);
router.delete(
  "/:propertyId/:messageTemplateId",
  authenticateToken,
  checkPropertyAccess,
  remove
);
module.exports = router;
