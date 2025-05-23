const { Router } = require("express");
const countryFile = require("../data/country.json");
const countryStatesFile = require("../data/country+state.json");
const countryStateCityFile = require("../data/country+state+city.json");
const timezoneFile = require("../data/timezone.json");
const zipcodeFile = require("../data/zipcodes.json");
const { BadRequestError, InternalServerError } = require("../lib/CustomErrors");
const { responseHandler } = require("../middlewares/response.middleware");
const router = Router();

router.get("/", async (req, res, next) => {
  try {
    responseHandler(res, {
      countries: countryFile.map((c) => ({
        name: c.name,
        iso2: c.iso2,
        phoneCode: `+${c.phone_code}`,
      })),
    });
  } catch (e) {
    return next(new InternalServerError());
  }
});

router.get("/:country/timezones", async (req, res, next) => {
  try {
    const countryIso = req.params.country;
    const timezone = countryFile.find((c) => c.iso2 === countryIso).timezones;
    if (!timezone) {
      return next(
        new BadRequestError("Timezones not found", {
          timezones: ["Timezones not found"],
        }),
      );
    }
    responseHandler(res, { timezones: timezone });
  } catch (e) {
    return next(new InternalServerError());
  }
});

router.get("/:country/states", async (req, res, next) => {
  try {
    const countryIso = req.params.country;
    const states = countryStatesFile
      .find((c) => c.iso2 === countryIso)
      .states.map((s) => ({ name: s.name, state_code: s.state_code }));
    if (!states) {
      return next(
        new BadRequestError("States not found", {
          states: ["States not found"],
        }),
      );
    }
    responseHandler(res, { states: states });
  } catch (e) {
    return next(new InternalServerError(e.message));
  }
});

router.get("/:country/:state/cities", async (req, res, next) => {
  try {
    const countryIso = req.params.country;
    const stateCode = req.params.state;

    const cities = countryStateCityFile
      .find((c) => c.iso2 === countryIso)
      ?.states.find((s) => s.state_code === stateCode)
      ?.cities.map((c) => ({
        name: c.name,
      }));
    if (!cities) {
      return next(
        new BadRequestError("Bad Request", { cities: ["Cities not found"] }),
      );
    }
    responseHandler(res, { cities: cities });
  } catch (e) {
    return next(new InternalServerError(e.message));
  }
});

router.get("/:country/:zipcode", async (req, res, next) => {
  try {
    const countryIso = req.params.country;
    const zipcode = req.params.zipcode;

    const zipcodes = zipcodeFile.find(
      (c) => c.country_code === countryIso && c.zipcode === zipcode,
    );

    if (!zipcodes) {
      return next(
        new BadRequestError("Invalid zip code", {
          zipcode: ["Zipcode not found"],
        }),
      );
    }
    responseHandler(res, { zipcodes });
  } catch (e) {
    return next(new InternalServerError());
  }
});

module.exports = router;
