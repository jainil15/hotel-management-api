const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = new Schema(
  {
    property: { type: Schema.Types.ObjectId, ref: "Property", required: true },
    guestId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    senderId: { type: Schema.Types.ObjectId, required: true },
    receiverId: { type: Schema.Types.ObjectId, required: true },
    content: { type: String, required: true },
    messageType: { type: String, required: true },
    messageTriggerType: { type: Number, required: true },
    active: { type: Boolean, required: true },
  },
  { timestamps: true}
);

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;