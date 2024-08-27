const router = require("express").Router();
const guestApiController = require("../controllers/guestApi.controller");
const {
  authenticateGuestSession,
} = require("../middlewares/guestAccess.middleware");
const guestApiRouter = require("express").Router();
const multer = require("multer");

const upload = multer();

router.get("/guest", guestApiController.getGuestWithStatus);
router.get("/workflow", guestApiController.getWorkflow);
router.get("/property", guestApiController.getProperty);
router.get("/settings", guestApiController.getSettings);
router.get("/guest/status", guestApiController.getGuestStatus);
router.get("/checkInOutRequest", guestApiController.getCheckInOutRequest);
router.get("/addOns", guestApiController.getAddOns);

router.post("/checkInOutRequest", guestApiController.createCheckInOutRequest);
router.post(
  "/preArrival",
  upload.fields([
    { name: "guestSignature", maxCount: 1 },
    { name: "guestIdProof", maxCount: 1 },
  ]),
  guestApiController.createPreArrival,
);

router.post("/review", guestApiController.createReview);
router.post("/addOnsRequest", guestApiController.createAddOnsRequest);
guestApiRouter.use("/:guestSessionId", authenticateGuestSession, router);

module.exports = guestApiRouter;
