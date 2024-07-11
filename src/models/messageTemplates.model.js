const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageTemplateSchema = new Schema(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true },
    status: { type: String, required: true },
    message: { type: String, required: true },
    active: { type: Boolean, required: true },
  },
  { timestamps: true }
);

const MessageTemplate = mongoose.model("MessageTemplate", messageTemplateSchema);
module.exports = MessageTemplate;