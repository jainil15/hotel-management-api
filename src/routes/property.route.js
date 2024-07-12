const { Router } = require("express");
const {
  create,
  getAll,
  update,
  remove,
  getById,
} = require("../controllers/property.controller");
const { authenticateToken } = require("../middlewares/jwt.middleware");
const {
  checkPropertyAccess,
  checkPermissions,
} = require("../middlewares/propertyaccess.middleware");

const router = Router();

router.post("/", authenticateToken, checkPermissions("admin"), create);
router.get("/", authenticateToken, getAll);
router.get("/:propertyId", authenticateToken, checkPropertyAccess, getById);
router.put("/:propertyId", authenticateToken, checkPropertyAccess, update);
router.delete("/:propertyId", authenticateToken, checkPropertyAccess, remove);
module.exports = router;
