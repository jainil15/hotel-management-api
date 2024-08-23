const router = require("express").Router();
const guestApiController = require("../controllers/guestApi.controller");
const {
  authenticateGuestSession,
} = require("../middlewares/guestAccess.middleware");
const guestApiRouter = require("express").Router();

router.get("/guest", guestApiController.getGuestWithStatus);
router.get("/workflow", guestApiController.getWorkflow);
router.get("/property", guestApiController.getProperty);
router.get("/settings", guestApiController.getSettings);
router.get("/guest/status", guestApiController.getGuestStatus);
router.post("/checkInOutRequest", guestApiController.createCheckInOutRequest);
router.post("/preArrival", guestApiController.createPreArrival);

guestApiRouter.use("/:guestSessionId", authenticateGuestSession, router);

module.exports = guestApiRouter;
