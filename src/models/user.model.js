const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { z } = require("zod");
const userSchema = new Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    role: { type: String, required: true },
    active: { type: Boolean, required: true },
  },
  { timestamps: true }
);

const UserValidationSchema = z.object({
  username: z.string(),
  email: z.string().email(),
  password: z.string(),
  phoneNumber: z.string().min(10).max(10),
  role: z.string().min(1).max(255).optional(),
  active: z.boolean(),
});

const User = mongoose.model("User", userSchema);

module.exports = { User, UserValidationSchema };
