const { Token } = require("../models/token.model");

const { ValidationError } = require("../lib/CustomErrors");
/**
 * Create a new token for a user
 * @param {string} userId - The ID of the user for whom the token is created
 * @param {object} session - The mongoose session for transaction support
 * @returns {Promise<import('../models/token.model.js').TokenType>} - The created token object
 */
const createToken = async (userId, session) => {
  const existingToken = await Token.findOne({ userId });
  if (existingToken) {
    await existingToken.deleteOne({ session });
  }
  const tokenObj = new Token({ userId });
  await tokenObj.save({ session });
  return tokenObj;
};

/**
 * Get a token by its value
 * @param {string} token - The token string to search for
 * @returns {Promise<import('../models/token.model.js').TokenType>} - The token object if found, otherwise null
 */
const getByToken = async (token) => {
  const tokenObj = await Token.findOne({ token });
  return tokenObj;
};

/**
 * Get a token by user ID
 * @param {string} userId - The ID of the user to find the token for
 * @returns {Promise<import('../models/token.model.js').TokenType>} - The token object if found, otherwise null
 */
const getByUserId = async (userId) => {
  const tokenObj = await Token.findOne({ userId });
  return tokenObj;
};

/**
 * Verify Token
 * @param {string} userId - The ID of the user to find the token for
 * @param {string} token - The ID of the user to find the token for
 * @returns {Promise<import('../models/token.model.js').TokenType>} - The token object if found, otherwise null
 */
const verifyToken = async (token) => {
  const tokenObj = await Token.findOne({ token });
  if (!tokenObj) {
    throw new ValidationError("Invalid Token", { token: ["Invalid Token"] });
  }
  return tokenObj;
};

const invalidateToken = async (userId, session) => {
  await Token.deleteOne({ userId: userId }, { session });
};

module.exports = {
  createToken,
  getByToken,
  getByUserId,
  verifyToken,
  invalidateToken,
};
