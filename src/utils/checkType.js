const checkImageType = (fileType, supportedTypes) => {
  return supportedTypes.includes(fileType);
};
module.exports = checkImageType;
