const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const propertyAccessSchema = new Schema(
	{
		userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
		propertyId: {
			type: Schema.Types.ObjectId,
			ref: "Property",
			required: true,
		},
	},
	{ timestamps: true },
);
propertyAccessSchema.index({ userId: 1, propertyId: 1 }, { unique: true });

/**
 * @typedef {import("mongoose").Model<PropertyAccess>} PropertyAccess
 * @typedef {typeof PropertyAccess.schema.obj} PropertyAccessType
 */
const PropertyAccess = mongoose.model("PropertyAccess", propertyAccessSchema);
module.exports = PropertyAccess;
