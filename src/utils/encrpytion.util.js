const bcrypt = require("bcryptjs");
const encrypt = async (data) => {
  const salt = await bcrypt.genSalt(10);
  const hashedData = await bcrypt.hash(data, salt);
  return hashedData;
};

const verify = async (data, hashedData) => {
  const isValid = await bcrypt.compare(data, hashedData);
  return isValid;
};

module.exports = { encrypt, verify };
