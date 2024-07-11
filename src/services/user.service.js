const { User } = require("../models/user.model");
const bcrypt = require("bcrypt");

// Create user
const create = async (_user) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: _user.email });
    if (existingUser) {
      throw new Error("User already exists");
    }

    // Hash password
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    // console.log(_user);
    const hashedPassword = await bcrypt.hash(_user.password, salt);
    // console.log(salt);

    // Create user
    const user = new User({ ..._user, password_hash: hashedPassword });
    await user.save();
  } catch (e) {
    throw new Error("Error creating user" + e);
  }
};

const authenticate = async (email, password) => {
  try {
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
  } catch (e) {
    throw new Error("Error logging in user");
  }
};

// Get user by email
const getByEmail = async (email) => {
  try {
    // Get user by email
    const user = await User.findOne({
      email: email,
    });
    return user;
  } catch (e) {
    throw new Error("Error getting user by email");
  }
};

module.exports = { create, getByEmail, authenticate };
