const { Router } = require("express");
const {
  getAccessToken,
  verifyOtp,
  resendOtp,
} = require("../controllers/auth.controller");

require("dotenv").config();
const router = Router();

router.get("/accessToken", getAccessToken);
router.post("/verifyOtp", verifyOtp);
router.post("/resendOtp", resendOtp);
module.exports = router;
