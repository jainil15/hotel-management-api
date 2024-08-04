const { default: mongoose } = require("mongoose");
const { z } = require("zod");

const Schema = mongoose.Schema;

const broadcastSchema = new Schema(
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
		messages: [
			{
				type: String,
				required: true,
			},
		],
	},
	{ timestamps: true },
);

const CreateBroadcastValidationSchema = z.object({
	propertyId: z.string(),
	guestIds: z.array(z.string()),
	messages: z.array(z.string()),
});

const Broadcast = mongoose.model("Broadcast", broadcastSchema);

module.exports = { Broadcast, CreateBroadcastValidationSchema };