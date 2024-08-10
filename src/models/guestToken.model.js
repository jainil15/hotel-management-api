const { default: mongoose } = require("mongoose");

const Schema = require("mongoose").Schema;

const guestTokenSchema = new Schema(
	{
		guestId: { type: Schema.Types.ObjectId, ref: "Guest", required: true },
		token: { type: String, required: true },
		expiry: { type: Date, required: true },
	},
	{ timestamps: true },
);

guestTokenSchema.index({ guestId: 1 }, { unique: true });

/**
 * @typedef {import("mongoose").Model<GuestToken>} GuestToken
 * @typedef {typeof GuestToken.schema.obj} GuestTokenType
 */
const GuestToken = mongoose.model("GuestToken", guestTokenSchema);

module.exports = { GuestToken };
