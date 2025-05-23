const router = require("express").Router();

const qrCodeScanController = require("../controllers/qrCodeScan.controller");

router.post("/:propertyId", qrCodeScanController.create);

module.exports = router;
