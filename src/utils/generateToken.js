const jwt = require("jsonwebtoken");

// Generate access token util
const generateAccessToken = (payload, expiration, secret) => {
  const accessToken = jwt.sign(payload, secret, {
    expiresIn: expiration,
  });
  return accessToken;
};

module.exports = { generateAccessToken };
