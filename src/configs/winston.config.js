const winston = require("winston");
const { format, transports } = require("winston");
const logger = winston.createLogger({
  level: "debug",
  format: winston.format.combine(
    format((info) => {
      info.level = info.level.toUpperCase();
      return info;
    })(),
    format.colorize({ all: true }),
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.prettyPrint({ colorize: true, depth: 3 }),
    format.printf(
      (info) => `[${info.level}] [${info.timestamp}] ${info.message}`
    )
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
    new transports.File({
      filename: "logs/combined.log",
      format: format.combine(format.uncolorize(), format.json()),
    }),
    new transports.Console(),
  ],
});

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