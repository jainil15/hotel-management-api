const { reservationDispatcher, houseKeepingDispatcher } = require("../controllers/hotelKeyPms.controller");

const router = require("express").Router();

router.post("/reservation", reservationDispatcher);
router.post("/houseKeeping", houseKeepingDispatcher);

module.exports = router;