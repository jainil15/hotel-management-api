const { Router } = require("express");
const {
  getAccessToken,
  verifyOtp,
  resendOtp,
  refreshAccessToken,
} = require("../controllers/auth.controller");
const authController = require("../controllers/auth.controller");
const forgotPasswordController = require("../controllers/forgotPassword.controller");

const { authenticateToken } = require("../middlewares/jwt.middleware");
require("dotenv").config();
const router = Router();

router.get("/accessToken", getAccessToken);
router.post("/verifyOtp", verifyOtp);
router.post("/resendOtp", resendOtp);
router.get(
  "/guestAccessToken/:guestId",
  authController.genreateGuestAccessToken,
);

router.post("/refresh-token", refreshAccessToken);
router.post("/guestLogin/:token", authController.guestLoginWithToken);
router.get("/isLoggedIn", authenticateToken, authController.isLoggedIn);
router.post("/forgotPassword", forgotPasswordController.forgotPassword);
router.post("/resetPassword", forgotPasswordController.resetPassword);

module.exports = router;
