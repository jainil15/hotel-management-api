const { default: mongoose } = require("mongoose");
const { z } = require("zod");

const Schema = require("mongoose").Schema;

const chatListSchema = new Schema(
	{
		propertyId: {
			type: Schema.Types.ObjectId,
			ref: "Property",
			required: true,
		},
		guestId: {
			type: Schema.Types.ObjectId,
			ref: "Guest",
			required: true,
		},
		unreadMessages: {
			type: Number,
			default: 0,
		},
		latestMessage: {
			type: Schema.Types.ObjectId,
			ref: "Message",
		},
	},
	{ timestamps: true },
);

chatListSchema.index({ propertyId: 1, guestId: 1 }, { unique: true });

const CreateChatListValidationSchema = z.object({});

const UpdateChatListValidationSchema = z.object({
	unreadMessages: z.number().optional(),
	latestMessage: z.string().optional(),
});

const ChatList = mongoose.model("ChatList", chatListSchema);

module.exports = {
	ChatList,
	CreateChatListValidationSchema,
	UpdateChatListValidationSchema,
};
