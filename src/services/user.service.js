const { User } = require("../models/user.model");
const bcrypt = require("bcrypt");

const create = async (_user) => {
  try {
    const existingUser = await User.findOne({ email: _user.email });
    if (existingUser) {
      throw new Error("User already exists");
    }
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    console.log(_user);
    const hashedPassword = await bcrypt.hash(_user.password, salt);
    console.log(salt);

    const user = new User({ ..._user, password_hash: hashedPassword });
    await user.save();
  } catch (e) {
    throw new Error("Error creating user" + e);
  }
};

const authenticate = async (email, password) => {
  try {
    const user = await getByEmail(email);
    if (!user) {
      return null;
    }
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return null;
    }
    return user;
  } catch (e) {
    throw new Error("Error logging in user");
  }
};

const getByEmail = async (email) => {
  try {
    const user = await User.findOne({
      email: email,
    });
    return user;
  } catch (e) {
    throw new Error("Error getting user by email");
  }
};

module.exports = { create, getByEmail, authenticate };
