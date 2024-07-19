const { default: mongoose } = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    user: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      password_hash: { type: String, required: true },
      phoneNumber: { type: String, required: true },
      role: { type: String, required: true },
      active: { type: Boolean },
    },
    otp: { type: String, required: true },
    expiresAt: {
      type: Date,
      required: true,
      default: Date.now() + 600,
    },
  },
  { timestamps: true }
);
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 600 });
const Otp = mongoose.model("Otp", otpSchema);
Otp.init().then(() => {
  console.log("Initialzed Otp Model");
});

module.exports = { Otp };
