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
    currentStatus: {
      type: String,
      enum: [
        "Reservation Confirmed",
        "Early Check In",
        "Standard Check In",
        "In House",
        "Late Check Out",
        "Standard Check Out",
      ],
      required: true,
    },
    flag: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

const GuestStatus = mongoose.model("GuestStatus", guestStatusSchema);
GuestStatus.init().then((GuestStatus) => {});
module.exports = GuestStatus;
