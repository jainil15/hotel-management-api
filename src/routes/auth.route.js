const { Router } = require("express");
const { getAccessToken } = require("../controllers/auth.controller");
const router = Router();

router.get("/accessToken", getAccessToken);

module.exports = router;