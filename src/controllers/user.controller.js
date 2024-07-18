const { UserValidationSchema, User } = require("../models/user.model");
const userService = require("../services/user.service");
const authService = require("../services/auth.service");
const propertyAccessService = require("../services/propertyAccess.service");
const { generateAccessToken } = require("../utils/generateToken");
const { z } = require("zod");
const cookieOptions = require("../configs/cookie.config");
const { Otp } = require("../models/otp.model");
const sendOtp = require("../utils/sendOtp");
const bcrypt = require("bcrypt");
const { generateOtp } = require("../utils/generateOtp");
const otpService = require("../services/otp.service");
const { default: mongoose } = require("mongoose");
const logger = require("../configs/winston.config");
// Registering new User
const register = async (req, res) => {
  try {
    
    // get user detail from body
    const user = req.body;
    // validate user details
    const result = UserValidationSchema.safeParse(user);

    // validation errors
    if (!result.success) {
      return res
        .status(400)
        .json({ error: result.error.flatten().fieldErrors });
    }

    // check if user already exists
    const existingUser = await userService.getByEmail(user.email);
    if (existingUser) {
      return res.status(409).json({ error: { email: "Email already exists" } });
    }
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    // console.log(_user);
    const hashedPassword = await bcrypt.hash(user.password, salt);
    const otp = generateOtp();
    const newOtp = otpService.create({
      email: user.email,
      otp: otp,
      user: { ...user, role: "admin", password_hash: hashedPassword },
    });
    const sentMail = await sendOtp(user.email, otp);
    return res.status(200).json({ result: { message: "Email Sent" } });
    // send otp to user email
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: { server: "Internal server error" } });
  }
};

// Login
const login = async (req, res) => {
  try {
    // get email and password from body
    const { email, password } = req.body;

    // validate email and password
    const result = z
      .object({
        email: z.string().email(),
        password: z.string().min(1),
      })
      .safeParse({ email, password });
    // validation errors
    if (!result.success) {
      return res
        .status(400)
        .json({ error: result.error.flatten().fieldErrors });
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
        "1d",
        process.env.ACCESS_TOKEN_SECRET
      );
      const refreshToken = generateAccessToken(
        { ..._user, sessionId: session._id },
        "15d",
        process.env.REFRESH_TOKEN_SECRET
      );
      // set refresh token in cookie
      res.cookie("refreshToken", refreshToken, cookieOptions);
      // return user and access token
      // req.user = _user;
      return res
        .status(200)
        .json({ result: { user: _user, accessToken: accessToken } });
    }
    // return error if user is not authenticated
    return res.status(401).json({ error: { auth: "Invalid credentials" } });
  } catch (e) {
    return res
      .status(500)
      .json({ error: { server: "Internal server error" + e } });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    // delete session and clear refresh token
    const session = await authService.deleteSession(req.user.email);
    res.clearCookie("refreshToken");
    return res.status(200).json({ result: "Logged out successfully" });
  } catch (e) {
    return res
      .status(500)
      .json({ error: { server: "Internal server error" + e } });
  }
};

// Get User
const getUser = async (req, res) => {
  const { iat, exp, ...user } = req.user;
  try {
    return res.status(200).json({ result: user });
  } catch (e) {
    return res
      .status(500)
      .json({ error: { server: "Internal server error" + e.message } });
  }
};

// Create user
const create = async (req, res) => {
  try {
    const user = req.body;
    const propertyId = req.params.propertyId;
    const result = UserValidationSchema.safeParse(user);
    if (!result.success) {
      return res
        .status(400)
        .json({ error: result.error.flatten().fieldErrors });
    }
    const newUser = await userService.create(user);
    const newPropertyAccess = await propertyAccessService.create(
      propertyId,
      newUser._id
    );
    return res.status(200).json({ result: { user: newUser } });
  } catch (e) {
    return res
      .status(500)
      .json({ error: { server: "Internal server error" + e } });
  }
};

module.exports = { register, login, logout, getUser, create };
