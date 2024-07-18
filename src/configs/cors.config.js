require("dotenv").config();
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  optionsSuccessStatus: 200,
  credentials: true,
};

const allowList = [
  process.env.FRONTEND_URL,
  "https://testhotel.onelyk.com",
  "http://localhost:3000",
  "https://4ckpq2tm-3000.inc1.devtunnels.ms",
  "https://8l4qkmp2-8000.inc1.devtunnels.ms",
];

let corsOptionsDelegate = (req, callback) => {
  let corsOptions;
  if (allowList.indexOf(req.header("Origin")) !== -1) {
    corsOptions = { origin: true, credentials: true };
  } else {
    corsOptions = { origin: false };
  }
  callback(null, corsOptions);
};

module.exports = { corsOptions, corsOptionsDelegate };
