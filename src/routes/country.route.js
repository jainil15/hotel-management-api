const { Router } = require("express");
const countryFile = require("../data/country.json");
const countryStatesFile = require("../data/country+state.json");
const countryStateCityFile = require("../data/country+state+city.json");
const timezoneFile = require("../data/timezone.json");
const zipcodeFile = require("../data/zipcodes.json");
const router = Router();

router.get("/", async (req, res) => {
  try {
    return res.status(200).json({
      result: {
        countries: countryFile.map((c) => ({ name: c.name, iso2: c.iso2 })),
      },
    });
  } catch (e) {
    return res
      .status(500)
      .json({ error: { server: "Internal Server Error " + e } });
  }
});

router.get("/:country/timezones", async (req, res) => {
  try {
    const countryIso = req.params.country;
    const timezone = countryFile.find((c) => c.iso2 === countryIso).timezones;
    if (!timezone) {
      return res
        .status(400)
        .json({ error: { timezones: "Timezones not found" } });
    }
    return res.status(200).json({ result: { timezones: timezone } });
  } catch (e) {
    return res
      .status(500)
      .json({ error: { server: "Internal Server Error " + e } });
  }
});

router.get("/:country/states", async (req, res) => {
  try {
    const countryIso = req.params.country;
    const states = countryStatesFile
      .find((c) => c.iso2 === countryIso)
      .states.map((s) => ({ name: s.name, state_code: s.state_code }));
    if (!states) {
      return res.status(400).json({ error: { states: "States not found" } });
    }
    return res.status(200).json({ result: { states: states } });
  } catch (e) {
    return res
      .status(500)
      .json({ error: { server: "Internal Server Error " + e } });
  }
});

router.get("/:country/:state/cities", async (req, res) => {
  try {
    const countryIso = req.params.country;
    const stateCode = req.params.state;

    const cities = countryStateCityFile
      .find((c) => c.iso2 === countryIso)
      .states.find((s) => s.state_code === stateCode)
      ?.cities.map((c) => ({
        name: c.name,
      }));
    if (!cities) {
      return res.status(400).json({ error: { city: "Cities not found" } });
    }
    return res.status(200).json({ result: { cities: cities } });
  } catch (e) {
    return res.status(500).json({ error: { server: "Internal server error" } });
  }
});

router.get("/:country/:zipcode", async (req, res) => {
  try {
    const countryIso = req.params.country;
    const zipcode = req.params.zipcode;

    const zipcodes = zipcodeFile.find(
      (c) => c.country_code === countryIso && c.zipcode === zipcode
    );

    if (!zipcodes) {
      return res.status(400).json({ error: { zipcode: "Zipcode not found" } });
    }
    return res.status(200).json({ result: { zipcodes: zipcodes } });
  } catch (e) {
    return res.status(500).json({ error: { server: "Internal server error" } });
  }
});

module.exports = router;
