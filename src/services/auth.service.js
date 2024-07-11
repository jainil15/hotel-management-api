const Session = require("../models/session.model");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Create a new session
const createSession = async (user) => {
  try {
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
  } catch (e) {
    throw new Error("Error creating session" + e);
  }
};

// Get a session by email
const getSession = async (email) => {
  try {
    // console.log(email);
    // Find the session by email
    const existingSession = await Session.findOne({ email: email });
    // If session does not exist, throw an error
    if (!existingSession) {
      throw new Error("Session does not exist");
    }
    // return the session
    return existingSession;
  } catch (e) {
    throw new Error("Error getting session" + e);
  }
};

// Delete a session by email
const deleteSession = async (email) => {
  try {
    // Find the session by email
    const existingSession = await Session.findOne({ email: email });
    // If session does not exist, throw an error
    if (!existingSession) {
      throw new Error("Session does not exist");
    }
    // // Set the session to invalid
    // existingSession.valid = false;
    // Delete session
    await existingSession.deleteOne();
    return existingSession;
  } catch (e) {
    throw new Error("Error deleting session" + e);
  }
};

const decodeRefreshToken = async (refreshToken) => {
  try {
    const decoded = await jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    console.log(decoded);
    return decoded;
  } catch (e) {
    throw new Error("Error verifying refresh token" + e);
  }
};

module.exports = { createSession, getSession, decodeRefreshToken, deleteSession };
