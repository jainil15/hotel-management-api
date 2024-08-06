const supportedTypes = require("../constants/supportedTypes");

/**
 * Check if the image type is supported
 * @param {string} fileType - The file type
 * @returns {boolean} - Value indicating if the image type is supported
 */
const checkImageType = (fileType) => {
	return supportedTypes.includes(fileType);
};
module.exports = checkImageType;
