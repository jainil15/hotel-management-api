const router = require("express").Router();
const {
  folioDispatcher,
  roomStatusDispatcher,
} = require("../controllers/asiPms.controller.js");
const {
  checkPropertyPms,
} = require("../middlewares/propertyPms.middleware.js");

router.post("/folio", checkPropertyPms, folioDispatcher);
router.post("/roomStatus", checkPropertyPms, roomStatusDispatcher);

module.exports = router;
