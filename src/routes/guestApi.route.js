const router = require("express").Router();

const propertyController = require("../controllers/property.controller");

router.get("/property", propertyController.getById);

module.exports = router;
