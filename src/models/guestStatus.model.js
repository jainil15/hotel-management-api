const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const guestStatusSchema = new Schema(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    guestId: { type: Schema.Types.ObjectId, ref: "Guest", required: true },
    status: { type: String, required: true },
    flag: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);



const GuestStatus = mongoose.model("GuestStatus", guestStatusSchema);
module.exports = GuestStatus;
