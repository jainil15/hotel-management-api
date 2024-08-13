const winston = require("winston");
const { format, transports } = require("winston");
const customLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};
const customColors = {
  error: "redBG",
  warn: "yellowBG",
  info: "greenBG",
  http: "blueBG",
  verbose: "cyanBG",
  debug: "magentaBG",
  silly: "whiteBG",
};
const logger = winston.createLogger({
  level: "debug",
  format: winston.format.combine(
    format((info) => {
      info.level = info.level.toUpperCase();
      return info;
    })(),

    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.prettyPrint({ colorize: true, depth: 3 }),
    format.printf(
      (info) =>
        `[${info.level == "INFO" ? "INFO" : "HTTP"}] [${info.timestamp}] ${info.message}`,
    ),
    format.colorize({ all: true }),
  ),

  transports: [
    //
    // - Write all logs with importance level of `error` or less to `error.log`
    // - Write all logs with importance level of `info` or less to `combined.log`
    //

    new transports.File({
      filename: "logs/error.log",
      level: "error",
      format: format.combine(format.uncolorize(), format.json()),
    }),

    new transports.Console(),
  ],
});
// winston.addColors(customColors);

if (process.env.NODE_ENV === "production") {
  logger.add(
    new transports.File({
      filename: "logs/combined.log",
      format: format.combine(format.uncolorize(), format.json()),
    }),
  );
}

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
// if (process.env.NODE_ENV === "production") {
//   logger.add(
//     new winston.transports.Console({
//       format: winston.format.simple(),
//     })
//   );
// }

module.exports = logger;
