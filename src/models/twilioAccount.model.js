const mongoose = require("mongoose");
const { z } = require("zod");
const Schema = mongoose.Schema;

const twilioAccountSchema = new Schema({
  propertyId: { type: Schema.Types.ObjectId, required: true },
  sid: { type: String, required: true },
  authToken: { type: String, required: true },
  dateCreated: { type: Date, required: true },
  dateUpdated: { type: Date, required: true },
  friendlyName: { type: String, required: true },
  ownerAccountSid: { type: String, required: true },
  status: { type: String, required: true },
});

const TwilioAccount = mongoose.model("TwilioAccount", twilioAccountSchema);
TwilioAccount.init().then(() => {
  console.log("Initialzed TwilioAccount Model");
});
module.exports = { TwilioAccount };
