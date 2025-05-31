/**
 * Utility functions for house keeping requests.
 * @module houseKeepingUtil
 */

/**
 * Check if the provided options in the house keeping request are valid.
 * @param {Array<string>} options - The house keeping request object.
 * @param {Array<string>} validOptions - The list of valid options.
 * @returns {boolean} - Returns true if all options are valid, false otherwise.
 */
function checkOptions(options, validOptions) {
  console.log("Checking options:", options, validOptions);
  if (validOptions.length === 0) {
    return true;
  }
  if (options.length === 0) {
    return false;
  }
  return options.every((option) => validOptions.includes(option));
}

module.exports = {
  checkOptions,
};
