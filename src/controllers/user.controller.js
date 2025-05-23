const { UserValidationSchema, User } = require("../models/user.model");
const userService = require("../services/user.service");
const authService = require("../services/auth.service");
const propertyAccessService = require("../services/propertyAccess.service");
const { generateAccessToken } = require("../utils/generateToken");
const { z } = require("zod");
const { Otp } = require("../models/otp.model");
const sendOtp = require("../utils/sendOtp");
const bcrypt = require("bcryptjs");
const { generateOtp } = require("../utils/generateOtp");
const otpService = require("../services/otp.service");
const { default: mongoose } = require("mongoose");
const logger = require("../configs/winston.config");
const {
  ConflictError,
  APIError,
  ValidationError,
  UnauthorizedError,
  InternalServerError,
  InputValidationError,
} = require("../lib/CustomErrors");
const { responseHandler } = require("../middlewares/response.middleware");

/**
 * Register new user
 * @param {import('express').Request } req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {import('express').Response} - The response
 */

const cookieOptions = {
  maxAge: 24 * 60 * 60 * 1000 * 15, // Cookie will expire after 1 day
  httpOnly: true, // Cookie is only accessible via HTTP(S) and not client-side JavaScript
  secure: process.env.NODE_ENV === "production", // Cookie will only be sent over HTTPS if in production
  sameSite: "strict", // SameSite attribute to prevent CSRF attacks
};

const register = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // get user detail from body
    const user = req.body;
    // validate user details
    const result = UserValidationSchema.safeParse(user);

    // validation errors
    if (!result.success) {
      throw new InputValidationError(
        "Validation Error",
        result.error.flatten().fieldErrors,
      );
    }

    // check if user already exists
    const existingUser = await userService.getByEmail(user.email);
    if (existingUser) {
      throw new ConflictError("Email already exists", {
        email: ["Email already exists"],
      });
    }

    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);

    const hashedPassword = await bcrypt.hash(user.password, salt);
    const otp = generateOtp();

    await otpService.create(
      {
        email: user.email,
        otp: otp,
        expiresAt: Date.now(),
        user: { ...user, role: "admin", password_hash: hashedPassword },
      },
      session,
    );
    // send otp to user email
    sendOtp(user.email, otp);
    await session.commitTransaction();
    session.endSession();
    return responseHandler(res, {}, 201, "Email Sent");
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

/**
 * User login
 * @param {import('express').Request } req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {import('express').Response} - The response
 */
const login = async (req, res, next) => {
  try {
    // get email and password from body
    let { email, password, rememberMe } = req.body;
    email = email.toLowerCase();

    // validate email and password
    const result = z
      .object({
        email: z.string().email(),
        password: z.string().min(1),
      })
      .safeParse({ email, password });
    // validation errors
    if (!result.success) {
      throw new ValidationError(
        "Validation Error",
        result.error.flatten().fieldErrors,
      );
    }
    // authenticate user with email and password
    const user = await userService.authenticate(email, password);

    // if user is authenticated
    if (user) {
      // create session for refresh token
      const session = await authService.createSession({
        email: email,
        valid: true,
      });
      // generate access token and refresh token
      const { password_hash, ..._user } = user._doc;
      const accessToken = generateAccessToken(
        _user,
        "24h",
        process.env.ACCESS_TOKEN_SECRET,
      );

      // set refresh token if user click on remember me on login page
      if (rememberMe) {
        const refreshToken = generateAccessToken(
          { ..._user, sessionId: session._id },
          "15d",
          process.env.REFRESH_TOKEN_SECRET,
        );
        // set refresh token in cookie
        res.cookie("refreshToken", refreshToken, cookieOptions);
      }

      return responseHandler(
        res,
        { user: _user, accessToken },
        200,
        "Login Successful",
      );
    }
    // return error if user is not authenticated
    throw new UnauthorizedError("Invalid email or password", {
      email: ["Invalid email or password"],
      password: ["Invalid email or password"],
    });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

/**
 * Logout
 * @param {import('express').Request } req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {import('express').Response} - The response
 */
const logout = async (req, res, next) => {
  try {
    // delete session and clear refresh token
    await authService.deleteSession(req.user.email);
    res.clearCookie("refreshToken");

    return responseHandler(res, {}, 200, "Logout Successful");
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError());
  }
};

/**
 * Get user details
 * @param {import('express').Request } req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {import('express').Response} - The response
 */
const getUser = async (req, res, next) => {
  const user = req.user;
  try {
    return responseHandler(res, { user }, 200, "User Found");
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError());
  }
};

/**
 * Create new user
 * @param {import('express').Request } req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {import('express').Response} - The response
 */
const create = async (req, res, next) => {
  try {
    const user = req.body;
    const propertyId = req.params.propertyId;
    const result = UserValidationSchema.safeParse(user);
    if (!result.success) {
      throw new ValidationError(
        "Validation Error",
        result.error.flatten().fieldErrors,
      );
    }
    const newUser = await userService.create(user);
    const newPropertyAccess = await propertyAccessService.create(
      propertyId,
      newUser._id,
    );
    return responseHandler(res, { user: newUser }, 201, "User Created");
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError());
  }
};

module.exports = { register, login, logout, getUser, create };
