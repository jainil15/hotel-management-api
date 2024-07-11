const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const guestSchema = new Schema(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    phone_number: { type: String, required: true },
    source: { type: String, required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    confirmationNumber: { type: String, required: true },
    roomNumber: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    active: { type: Boolean, required: true },
  },
  { timestamps: true }
);

const Guest = mongoose.model("Guest", guestSchema);
module.exports = Guest;