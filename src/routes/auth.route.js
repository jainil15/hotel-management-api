const { Router } = require("express");
const { getAccessToken, verifyOtp } = require("../controllers/auth.controller");
const nodemailerConfigOtptions = require("../configs/nodemailer.config");
const nodemailer = require("nodemailer");

require("dotenv").config();
const router = Router();

router.get("/accessToken", getAccessToken);
router.post("/verifyOtp", verifyOtp);
module.exports = router;
