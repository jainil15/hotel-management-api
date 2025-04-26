const countryFile = require("../data/country.json");
/**
 * Get country iso2 code
 * @param {string} country - The country name
 * @returns {string} - The country iso2 code
 */
const getCountryIso2 = (country) => {
  return countryFile.find((c) => c.name === country)?.iso2;
};
/**
 * Get country code
 * @param {string} country - The country name
 * @returns {string} - The country code
 */
const getCountryCode = (iso3) => {
  console.log(iso3);
  return countryFile.find((c) => c.iso3 === iso3)?.phone_code;
};
module.exports = { getCountryIso2, getCountryCode };
