const { Router } = require("express");
const {
  getAccessToken,
  verifyOtp,
  resendOtp,
} = require("../controllers/auth.controller");
const { genreateGuestAccessToken } = require("../services/auth.service");
const authController = require("../controllers/auth.controller");
require("dotenv").config();
const router = Router();

router.get("/accessToken", getAccessToken);
router.post("/verifyOtp", verifyOtp);
router.post("/resendOtp", resendOtp);
router.get("/guestAccessToken/:guestId", authController.genreateGuestAccessToken);
module.exports = router;
