const errorMiddleware = async (req, res, next) => {
  res.on("", () => {
    console.log(res.statusCode);
  });
  // const errStatus = err.statusCode || 500;
  // const errMsg = err.message || "Something went wrong";
  // res.status(errStatus).json({
  //   success: false,
  //   status: errStatus,
  //   message: errMsg,
  //   stack: process.env.NODE_ENV === "development" ? err.stack : {},
  // });
  next();
};

module.exports = { errorMiddleware };
