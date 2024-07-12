const { Router } = require("express");
const {
  create,
  getAll,
  getById,
  update,
  remove,
} = require("../controllers/guest.controller");

const router = Router();

router.post("/:propertyId", create);
router.get("/:propertyId", getAll);
router.get("/:propertyId/:guestId", getById);
router.put("/:propertyId/:guestId", update);
router.delete("/:propertyId/:guestId", remove);

module.exports = router;