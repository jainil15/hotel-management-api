const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const sessionSchema = new Schema(
	{
		email: { type: String, required: true, unique: true },
		valid: { type: Boolean, required: true },
	},
	{ timestamps: true },
);

/**
 * @typedef {import("mongoose").Model<Session>} Session
 * @typedef {typeof Session.schema.obj} SessionType
 */
const Session = mongoose.model("Session", sessionSchema);
module.exports = Session;
