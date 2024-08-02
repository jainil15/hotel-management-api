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
const { ROLE } = require("../constants/role.constant");
const router = Router();
const upload = multer();
router.post(
  "/",
  authenticateToken,
  checkPermissions([ROLE.ADMIN]),
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  create
);

router.get(
  "/",
  authenticateToken,
  checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
  getAll
);
router.get(
  "/:propertyId",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
  getById
);
router.put(
  "/:propertyId",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
  update
);
router.delete(
  "/:propertyId",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
  remove
);
module.exports = router;
