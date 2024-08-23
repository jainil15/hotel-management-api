const logger = require("../configs/winston.config");
/**
 * Loggin middleware
 * @param {import('express').Request} req - request object
 * @param {import('express').Response} res - response object
 * @param {import('express').NextFunction} next - next function
 */
const loggerMiddleware = (req, res, next) => {
  const initialUrl = req.url;
  const uuid = req.headers["x-request-id"];
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  // logger.info(`[REQUEST] ${req.method} ${req.url} [${uuid}]`);
  try {
    res.on("finish", () => {
      const log = `| ${res.statusCode} | ${req.method} ${initialUrl} [${ip}] ${res.getHeader("x-response-time")} `;
      const logBody =
        process.env.NODE_ENV === "production"
          ? {
              log: log,
              request: req.body,
              response: res.contentBody,
            }
          : log;

      if (res.statusCode >= 400 && res.statusCode < 500) {
        logger.warn(logBody);
      } else if (res.statusCode >= 500) {
        logger.error(logBody);
      } else {
        logger.http(log);
      }
    });
  } catch {
  } finally {
    next();
  }
};

module.exports = { loggerMiddleware };
