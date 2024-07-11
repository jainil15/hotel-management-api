const { Router } = require("express");
const {
  register,
  login,
  logout,
  getUser,
} = require("../controllers/user.controller");
const { authenticateToken } = require("../middlewares/jwt.middleware");
const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", authenticateToken, logout);
router.get("/", authenticateToken, getUser);
module.exports = router;
