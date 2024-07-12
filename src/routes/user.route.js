const { Router } = require("express");
const {
  register,
  login,
  logout,
  getUser,
  create
} = require("../controllers/user.controller");
const { authenticateToken } = require("../middlewares/jwt.middleware");
const {
  checkPropertyAccess,
} = require("../middlewares/propertyaccess.middleware");

const router = Router();

// TODO: Change to auth route
router.post("/register", register);
router.post("/login", login);
router.post("/logout", authenticateToken, logout);

router.get("/", authenticateToken, getUser);

// User Routes
router.post("/:propertyId", authenticateToken, checkPropertyAccess, create);


module.exports = router;
