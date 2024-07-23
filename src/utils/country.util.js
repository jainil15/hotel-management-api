const countryFile = require("../data/country.json");
const getCountryIso2 = (country) => {
  return countryFile.find((c) => c.name === country)?.iso2;
};

module.exports = { getCountryIso2 };
