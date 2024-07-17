const generateOtp = () => {
  return (
    Math.floor(Math.random() * 10).toString() +
    Math.floor(Math.random() * 10).toString() +
    Math.floor(Math.random() * 10).toString() +
    Math.floor(Math.random() * 10).toString()
  );
};

const generateOtpVariable = (number) => {
  let otp = "";
  for (let i = 0; i < number; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
};

module.exports = { generateOtp, generateOtpVariable };
