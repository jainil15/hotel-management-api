const supportedTypes = require("../constants/supportedTypes");

const checkImageType = (fileType) => {
  return supportedTypes.includes(fileType);
};
module.exports = checkImageType;
