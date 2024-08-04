const bcrypt = require("bcryptjs");

/**
 * Encrypt data
 * @param {string} data - The data to encrypt
 * @returns {Promise<string>} - The encrypted data
 */
const encrypt = async (data) => {
  const salt = await bcrypt.genSalt(10);
  const hashedData = await bcrypt.hash(data, salt);
  return hashedData;
};

/**
 * Verify data
 * @param {string} data - The data to verify
 * @param {string} hashedData - The hashed data
 * @returns {Promise<boolean>} - The verification result
 */
const verify = async (data, hashedData) => {
  const isValid = await bcrypt.compare(data, hashedData);
  return isValid;
};

module.exports = { encrypt, verify };
