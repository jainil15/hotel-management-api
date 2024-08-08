const { request } = require("express");
const mongoose = require("mongoose");
const { z } = require("zod");
const {
	requestType,
	messageTriggerType,
	messageType,
} = require("../constants/message.constant");
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
		requestId: { type: Schema.Types.ObjectId, ref: "CheckInOutRequest" },
		messageTriggerType: { type: String, required: true },
		status: { type: String, default: "sent" },
		messageSid: { type: String },
	},
	{ timestamps: true, toJSON: { virtuals: true } },
);
messageSchema.virtual("request", {
	ref: "CheckInOutRequest",
	localField: "requestId",
	foreignField: "_id",
	justOne: true,
});
const MessageValidationSchema = z.object({
	propertyId: z.string(),
	guestId: z.string(),
	content: z.string(),
	messageType: z.enum(Object.values(messageType)),
	messageTriggerType: z.enum(Object.values(messageTriggerType)),
	requestId: z.string().optional(),
});

const CreateMessageValidationSchema = z.object({
	propertyId: z.string(),
	guestId: z.string(),
	content: z.string(),
	messageType: z.enum(Object.values(messageType)),
	messageTriggerType: z.enum(Object.values(messageTriggerType)),
	requestId: z.string().optional(),
});

/**
 * @typedef {import("mongoose").Model<Message>} Message
 * @typedef {typeof Message.schema.obj} MessageType
 */
const Message = mongoose.model("Message", messageSchema);
module.exports = {
	Message,
	MessageValidationSchema,
	CreateMessageValidationSchema,
};
