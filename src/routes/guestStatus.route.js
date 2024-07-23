const { Router } = require("express");
const { create } = require("../controllers/guestStatus.controller.js");
const router = Router();

router.post("/:propertyId/:guestId", create);

module.exports = router;
