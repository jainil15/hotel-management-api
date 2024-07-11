const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const sessionSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    valid: { type: Boolean, required: true },
  },
  {timestamps: true }
);

const Session = mongoose.model("Session", sessionSchema);
module.exports = Session;
