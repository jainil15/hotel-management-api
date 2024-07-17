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
const multer = require("multer");
const router = Router();
const upload = multer();
router.post(
  "/",
  authenticateToken,
  checkPermissions("admin"),
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  create
);

router.get("/", authenticateToken, getAll);
router.get("/:propertyId", authenticateToken, checkPropertyAccess, getById);
router.put("/:propertyId", authenticateToken, checkPropertyAccess, update);
router.delete("/:propertyId", authenticateToken, checkPropertyAccess, remove);
module.exports = router;
