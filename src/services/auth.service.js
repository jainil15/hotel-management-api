const { UnauthorizedError, NotFoundError } = require("../lib/CustomErrors");
const Session = require("../models/session.model");
const jwt = require("jsonwebtoken");
const { generateAccessToken } = require("../utils/generateToken");
require("dotenv").config();

// Create a new session
const createSession = async (user) => {
  // Check if session already exists
  const existingSession = await Session.findOne({ email: user.email });
  // If session exists, return the session
  if (existingSession) {
    return existingSession;
  }
  // Create a new session
  const session = new Session({ email: user.email, valid: true });
  await session.save();
  return session;
};

// Get a session by email
const getSession = async (email) => {
  // Find the session by email
  const existingSession = await Session.findOne({ email: email });
  // If session does not exist, throw an error
  if (!existingSession) {
    throw new UnauthorizedError("Session does not exist", {});
  }
  // return the session
  return existingSession;
};

// Delete a session by email
const deleteSession = async (email) => {
  // Find the session by email
  const existingSession = await Session.findOne({ email: email });
  // If session does not exist, throw an error
  if (!existingSession) {
    throw new UnauthorizedError("Session does not exist", {});
  }
  // // Set the session to invalid
  // existingSession.valid = false;
  // Delete session
  await existingSession.deleteOne();
  return existingSession;
};

const decodeRefreshToken = async (refreshToken) => {
  const decoded = await jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  return decoded;
};

const decodeAccessToken = async (accessToken) => {
  const decoded = await jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
  return decoded;
}


const genreateGuestAccessToken = (guest, expiry="1d") => {
  return generateAccessToken(
    {
      _id: guest._id,
      propertyId: guest.propertyId,
      email: guest.email,
      role: "guest",
      firstName: guest.firstName,
      lastName: guest.lastName,
      email: guest.email,
      phoneNumber: guest.phoneNumber,
      active: guest.active,
      createdAt: guest.createdAt,
      updatedAt: guest.updatedAt,
    },
    expiry,
    process.env.ACCESS_TOKEN_SECRET
  );
};

module.exports = {
  createSession,
  getSession,
  decodeRefreshToken,
  deleteSession,
  genreateGuestAccessToken,
  decodeAccessToken
};
