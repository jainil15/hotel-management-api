const { Router } = require("express");
const {
  register,
  login,
  logout,
  getUser,
  create,
} = require("../controllers/user.controller");
const { authenticateToken } = require("../middlewares/jwt.middleware");
const {
  checkPropertyAccess,
  checkPermissions,
} = require("../middlewares/propertyaccess.middleware");
const { errorMiddleware } = require("../middlewares/error.middleware");

const router = Router();

// Auth Routes
router.post("/register", register);
router.post("/login", login);
router.post("/logout", authenticateToken, logout);

// Get User
router.get("/", authenticateToken, getUser);

// User Routes
router.post(
  "/:propertyId",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions("admin"),
  create,
);

module.exports = router;
