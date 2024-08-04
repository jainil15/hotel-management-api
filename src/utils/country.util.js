const countryFile = require("../data/country.json");
/**
 * Get country iso2 code
 * @param {string} country - The country name 
 * @returns {string} - The country iso2 code
 */
const getCountryIso2 = (country) => {
  return countryFile.find((c) => c.name === country)?.iso2;
};

module.exports = { getCountryIso2 };
