const { ConflictError } = require("../lib/CustomErrors");
const { User } = require("../models/user.model");
const bcrypt = require("bcryptjs");

// Create user
const create = async (_user) => {
  // Check if user already exists
  const existingUser = await User.findOne({ email: _user.email });
  if (existingUser) {
    throw new ConflictError("User already exists", {
      email: ["User already exists"],
    });
  }

  // Hash password
  const saltRounds = 10;
  const salt = await bcrypt.genSalt(saltRounds);

  const hashedPassword = await bcrypt.hash(_user.password, salt);

  // Create user
  const user = new User({
    ..._user,
    password_hash: hashedPassword,
  });
  return await user.save();
};

const authenticate = async (email, password) => {
  // Get user by email
  const user = await getByEmail(email);
  if (!user) {
    return null;
  }
  // Compare password
  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    return null;
  }

  return user;
};

// Get user by email
const getByEmail = async (email) => {
    // Get user by email
    const user = await User.findOne({
      email: email,
    });
    return user;
 
};

module.exports = { create, getByEmail, authenticate };
