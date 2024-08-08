const { date, z } = require("zod");
const { dateregex } = require("../constants/regex.constant");

/**
 * Compare two dates
 * @param {string} date1 - date1
 * @param {string} date2 - date2
 * @returns {boolean} - Value indicating if the dates are equal
 */
const compareDate = (date1, date2) => {
	date1 = new Date(date1).toISOString();
	date2 = new Date(date2).toISOString();
	if (
		new Date(date1.split("T")[0]).getTime() ===
		new Date(date2.split("T")[0]).getTime()
	) {
		return true;
	}
	return false;
};

/**
 * Validate date format
 * @param {string} date - date
 * @returns {boolean} - Value indicating if the date is valid
 */
const dateValidation = (date) => {
	return dateregex.test(date) && !isNaN(Date.parse(date));
};

/**
 * Validate date format using zod
 * @param {string} date - date
 * @param {string} path - path
 * @returns {boolean} - Value indicating if the date is valid
 */
const zodCustomDateValidation = (date, path) => {
	return z
		.string()
		.refine(
			(date) => {
				return dateValidation(date);
			},
			{ message: "Invalid Date", path: [path] },
		)
		.safeParse(date);
};

/**
 * Compare two dates
 * @param {Date} date1 - date1
 * @param {Date} date2 - date2
 * @returns {boolean} - Value indicating if date1 is greater than date2
 */
const compareDateGt = (date1, date2) => {
	return date1 > date2;
};

module.exports = { compareDate, dateValidation, zodCustomDateValidation, compareDateGt };
