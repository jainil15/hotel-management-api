/**
 * @openapi
 * tags:

 *   name: Auth

 *   description: Auth Routes

 * /auth/accessToken:

 *   get:

 *     summary: Get Access Token

 *     description: Get Access Token

 *     tags: [Auth]

 *     parameters:

 *       - in: query

 *         name: email

 *         schema:

 *           type: string

 *     requestBody:

 *     content:

 *       application/json:

 *     schema:

 *       type: object

 *     responses:

 *       200:

 *         description: Received Access Token

 *         content:

 *           application/json:

 *             schema:

 *               type: object

 *       401:

 *         description: Unauthorized

 *         content:

 *           application/json:

 *             schema:

 *               type: object

 * 

 *       500:

 *         description: Internal Server Error

 *         content:

 *           application/json:

 *             schema:

 *             type: object
 */
const { Router } = require("express");
const { getAccessToken, verifyOtp } = require("../controllers/auth.controller");
const nodemailerConfigOtptions = require("../configs/nodemailer.config");
const nodemailer = require("nodemailer");

require("dotenv").config();
const router = Router();

router.get("/accessToken", getAccessToken);
router.post("/verifyOtp", verifyOtp);
module.exports = router;
