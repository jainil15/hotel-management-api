const zipcodeFile = require("../data/zipcodes.json");
const countryFile = require("../data/country.json");
const countryStateFile = require("../data/country+state.json");
const countryStateCityFile = require("../data/country+state+city.json");
const logger = require("../configs/winston.config");

/**
 * Validate zipcode
 * @param {string} country - The country
 * @param {string} state - The state
 * @param {string} zipcode - The zipcode
 * @returns {object} - The zipcode object
 */
const validateZipcode = (country, state, zipcode) => {
	const zip = zipcodeFile.find(
		(z) =>
			z.zipcode === zipcode &&
			z.country_code === countryFile.find((c) => c.name === country)?.iso2 &&
			z.state === state,
	);

	return zip;
};

module.exports = { validateZipcode };
