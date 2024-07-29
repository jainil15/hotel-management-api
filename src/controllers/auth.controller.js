const userService = require("../services/user.service");
const authService = require("../services/auth.service");
const optService = require("../services/otp.service");
const { generateAccessToken } = require("../utils/generateToken");
const { z } = require("zod");
const { User } = require("../models/user.model");
const cookieOptions = require("../configs/cookie.config");
const { generateOtp } = require("../utils/generateOtp");
const sendOtp = require("../utils/sendOtp");
const {
  ValidationError,
  UnauthorizedError,
  InternalServerError,
  APIError,
} = require("../lib/CustomErrors");
const { responseHandler } = require("../middlewares/response.middleware");

// Get access token
const getAccessToken = async (req, res, next) => {
  try {
    // Validate request query
    const validation = z
      .object({
        email: z.string().email(),
      })
      .safeParse(req.query);
    // Validation error
    if (!validation.success) {
      return next(
        new ValidationError(
          "Validation Error",
          validation.error.flatten().fieldErrors
        )
      );
    }
    // Get session
    const session = await authService.getSession(req.query.email);
    // Get refresh token from cookies
    const refreshToken = req.cookies["refreshToken"];
    // Check if refresh token exists
    if (!refreshToken) {
      return next(new UnauthorizedError("Refresh token not found", {}));
    }
    // Check if session exists
    if (!session) {
      return next(new UnauthorizedError("Session not found", {}));
    }
    // Check if session is valid
    if (!session.valid) {
      return next(new UnauthorizedError("Session is not valid", {}));
    }
    // Decode refresh token
    const decoded = await authService.decodeRefreshToken(refreshToken);
    // Check if email matches
    if (decoded.email !== req.query.email) {
      return next(new UnauthorizedError("Email does not match", {}));
    }
    // Extract payload
    const { __exp, sessionId, iat, exp, ...rest } = decoded;

    // Generate access token
    const accessToken = generateAccessToken(
      { ...rest },
      "1d",
      process.env.ACCESS_TOKEN_SECRET
    );
    // Send response
    return responseHandler(res, { accessToken });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError());
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const result = z
      .object({
        email: z.string().email(),
        otp: z.string(),
      })
      .safeParse(req.body);
    if (!result.success) {
      return next(
        new ValidationError(
          "Validation Error",
          result.error.flatten().fieldErrors
        )
      );
    }

    const newOtp = await optService.verify(email, otp);
    if (newOtp == null) {
      return next(
        new UnauthorizedError("Invalid OTP", { otp: ["Invalid OTP"] })
      );
    }
    const { user } = newOtp;
    const newUser = new User(user);
    await newUser.save();

    const { password_hash, ..._user } = newUser._doc;

    // return user and access token
    // req.user = _user;
    return responseHandler(
      res,
      { user: _user },
      201,
      "User created successfully"
    );
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError());
  }
};
const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = z
      .object({
        email: z.string().email(),
      })
      .safeParse(req.body);
    if (!result.success) {
      return next(
        new ValidationError(
          "Validation Error",
          result.error.flatten().fieldErrors
        )
      );
    }
    const otp = await optService.getByEmail(email);
    if (!otp) {
      return next(
        new UnauthorizedError("Email not found", { email: ["Email not found"] })
      );
    }
    const otpValue = generateOtp();
    otp.otp = otpValue;
    otp.expiresAt = Date.now();
    otp.deleteOne();
    const sentMail = sendOtp(otp.user.email, otpValue);
    await otp.save();
    return responseHandler(res, {}, 200, "Otp sent successfully");
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};
module.exports = { getAccessToken, verifyOtp, resendOtp };
