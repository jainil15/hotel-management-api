const { default: mongoose } = require("mongoose");
const { z } = require("zod");

const Schema = mongoose.Schema;

const broadcastMessageSchema = new Schema(
	{
		propertyId: {
			type: Schema.Types.ObjectId,
			ref: "Property",
			required: true,
		},
		guestIds: [
			{
				type: Schema.Types.ObjectId,
				ref: "Guest",
				required: true,
			},
		],
		content: { type: String, required: true },
	},
	{ timestamps: true },
);

const CreateBroadcastMessageValidationSchema = z.object({
	content: z.string(),
});

const UpdateBroadcastMessageValidationSchema = z.object({
	content: z.string().optional(),
});

/**
 * @typedef {import("mongoose").Model<BroadcastMessage>} BroadcastMessage
 * @typedef {typeof BroadcastMessage.schema.obj} BroadcastMessageType
 */
const BroadcastMessage = mongoose.model(
	"BroadcastMessage",
	broadcastMessageSchema,
);

module.exports = {
	BroadcastMessage,
	CreateBroadcastMessageValidationSchema,
	UpdateBroadcastMessageValidationSchema,
};
