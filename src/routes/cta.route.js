const router = require("express").Router();

const ctaController = require("../controllers/cta.controller");

router.post(
  "/contact-us",

  ctaController.contactUs,
);

router.post(
  "/book-demo",

  ctaController.bookDemo,
);

router.post(
  "/trial-request",

  ctaController.requestTrial,
);

module.exports = router;
