const mongoose = require("mongoose");
const { z } = require("zod");
const Schema = mongoose.Schema;

const messageSchema = new Schema(
	{
		guestId: { type: Schema.Types.ObjectId, ref: "Guest", required: true },
		propertyId: {
			type: Schema.Types.ObjectId,
			ref: "Property",
			required: true,
		},
		senderId: { type: Schema.Types.ObjectId, required: true },
		receiverId: { type: Schema.Types.ObjectId, required: true },
		content: { type: String, required: true },
		messageType: { type: String, required: true },
		messageTriggerType: { type: String, required: true },
		status: { type: String, default: "sent" },
		messageSid: { type: String },
	},
	{ timestamps: true },
);

const MessageValidationSchema = z.object({
	propertyId: z.string(),
	guestId: z.string(),
	content: z.string(),
	messageType: z.string(),
	messageTriggerType: z.number(),
});

const CreateMessageValidationSchema = z.object({
	propertyId: z.string(),
	guestId: z.string(),
	content: z.string(),
	messageType: z.string(),
	messageTriggerType: z.number(),
});

const Message = mongoose.model("Message", messageSchema);
module.exports = {
	Message,
	MessageValidationSchema,
	CreateMessageValidationSchema,
};
