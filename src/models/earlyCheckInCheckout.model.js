const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const earlyCheckInCheckOutSchema = new Schema(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    guestId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    guestStatusId: { type: Schema.Types.ObjectId, required: true },
    earlyCheckinDateTime: { type: Date },
    earlyCheckoutDateTime: { type: Date },
    earlyCheckinRequestAction: { type: Number, required: true },
    earlyCheckoutRequestAction: { type: Number, required: true },
  },
  { timestamps: true }
);

const EarlyCheckInCheckOut = mongoose.model(
  "EarlyCheckInCheckOut",
  earlyCheckInCheckOutSchema
);
module.exports = EarlyCheckInCheckOut;
