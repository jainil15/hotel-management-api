const router = require("express").Router();
const propertyTokenController = require("../controllers/propertyTokens.controller");

router.get("/:propertyId", propertyTokenController.getByPropertyId);

module.exports = router;
