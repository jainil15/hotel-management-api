const { default: mongoose } = require("mongoose");
const logger = require("../configs/winston.config");

const otpSchema = new mongoose.Schema(
  {
    user: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      password_hash: { type: String, required: true },
      phoneNumber: { type: String },
      role: { type: String },
      active: { type: Boolean, default: true },
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
  logger.info("Initialzed Otp Model");
});

module.exports = { Otp };
