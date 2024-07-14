const mongoose = require("mongoose");
const { z } = require("zod");
const Schema = mongoose.Schema;

const messageSchema = new Schema(
  {
    guestId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    senderId: { type: Schema.Types.ObjectId, required: true },
    receiverId: { type: Schema.Types.ObjectId, required: true },
    content: { type: String, required: true },
    messageType: { type: String, required: true },
    messageTriggerType: { type: Number, required: true },
    active: { type: Boolean, required: true },
  },
  { timestamps: true }
);

const MessageValidationSchema = z.object({
  propertyId: z.string(),
  guestId: z.string(),
  content: z.string(),
  messageType: z.string(),
  messageTriggerType: z.number().int(),
  active: z.boolean(),
});

const Message = mongoose.model("Message", messageSchema);
module.exports = { Message, MessageValidationSchema };
