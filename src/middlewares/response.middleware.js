const { response } = require("express");
const { RESPONSE_STATUS } = require("../constants/responseStatus.constant");

/**
 * Response handler
 * @param {import("express").Response} res - Response object
 * @param {object} payload - Payload / Result object
 * @param {number} statusCode - Status code
 * @param {string} message - Message
 * @returns {import("express").Response} - Response object
 */
const responseHandler = async (
  res,
  payload,
  statusCode = 200,
  message = "Success",
) => {
  return res.status(statusCode).json({
    statusCode: statusCode,
    result: payload,
    status: "success",
    type: Object.keys(RESPONSE_STATUS).find(
      (key) => RESPONSE_STATUS[key] === statusCode,
    ),
    message: message,
  });
};

module.exports = { responseHandler };
