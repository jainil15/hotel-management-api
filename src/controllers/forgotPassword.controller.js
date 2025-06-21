const tokenService = require("../services/token.service");
const userService = require("../services/user.service");
const mongoose = require("mongoose");
const {
  APIError,
  InternalServerError,
  ValidationError,
} = require("../lib/CustomErrors");
const mailUtil = require("../utils/mail.util");
const { formatForgotPasswordMail } = require("../utils/forgotPassword.util");
const { responseHandler } = require("../middlewares/response.middleware");

const forgotPassword = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { email } = req.body;

    if (!email) {
      throw new ValidationError("Email is required", {
        email: ["Email is required"],
      });
    }

    const user = await userService.getByEmail(email);

    if (!user) {
      throw new ValidationError("User not found", {
        email: ["User not found for the given email"],
      });
    }

    const token = await tokenService.createToken(user, session);
    const mailTemplate = formatForgotPasswordMail(user, token);

    mailUtil.sendMail(user.email, "Password Reset Request", mailTemplate);
    await session.commitTransaction();
    session.endSession();
    return responseHandler(res, {
      message: "Password reset email sent successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    if (error instanceof APIError) {
      return next(error);
    }
    return next(new InternalServerError(error.message));
  }
};

const resetPassword = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { token, password, confirmPassword } = req.body;
    if (!token || !password || !confirmPassword) {
      throw new ValidationError("Token and new password are required", {
        token: ["Token is required"],
        password: ["New password is required"],
        confirmPassword: ["Confirm password is required"],
      });
    }
    if (password !== confirmPassword) {
      throw new ValidationError("Password and Confirm password must be same", {
        password: ["Password and confirm password must be same"],
        confirmPassword: ["Password and confirm password must be same"],
      });
    }

    const tokenObj = await tokenService.getByToken(token);

    if (!tokenObj) {
      throw new ValidationError("Invalid or expired token", {
        token: ["Invalid or expired token"],
      });
    }

    await userService.updatePassword(tokenObj.userId, password, session);
    await tokenService.invalidateToken(tokenObj.userId, session);
    await session.commitTransaction();
    session.endSession();

    return responseHandler(res, {
      message: "Password reset successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    if (error instanceof APIError) {
      return next(error);
    }
    return next(new InternalServerError(error.message));
  }
};
module.exports = { forgotPassword, resetPassword };
