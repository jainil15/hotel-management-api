const { ConflictError, NotFoundError } = require("../lib/CustomErrors");
const { User } = require("../models/user.model");
const bcrypt = require("bcryptjs");

/**
 * Create user
 * @param {object} _user - User
 * @returns {Promise<User>} - The new user
 */
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

/**
 * Authenticate user
 * @param {string} email - The email
 * @param {string} password - The password
 * @returns {Promise<User>} - The authenticated user
 */
const authenticate = async (email, password) => {
	// Get user by email
	const user = await getByEmail(email);
	if (!user) {
		throw new NotFoundError("User not found", {
			email: ["User not found for the given email"],
		});
	}
	// Compare password
	const validPassword = await bcrypt.compare(password, user.password_hash);
	if (!validPassword) {
		throw new NotFoundError("Invalid password", {
			password: ["Invalid password"],
		});
	}

	return user;
};

/**
 * Get user by email
 * @param {string} email - The email
 * @returns {Promise<User>} - The user
 */
const getByEmail = async (email) => {
	// Get user by email
	const user = await User.findOne({
		email: email,
	});
	return user;
};

module.exports = { create, getByEmail, authenticate };
