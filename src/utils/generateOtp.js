/**
 * Generates a 4 digit otp
 * @returns {string} - The generated otp
 */
const generateOtp = () => {
  return (
    Math.floor(Math.random() * 10).toString() +
    Math.floor(Math.random() * 10).toString() +
    Math.floor(Math.random() * 10).toString() +
    Math.floor(Math.random() * 10).toString()
  );
};

/**
 * Generates a variable length otp
 * @param {number} number - The length of the otp
 * @returns {string} - The generated otp
 */
const generateOtpVariable = (number) => {
  let otp = "";
  for (let i = 0; i < number; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
};

module.exports = { generateOtp, generateOtpVariable };
