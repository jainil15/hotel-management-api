const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { z } = require("zod");
const { phoneregex } = require("../constants/regex.constant");

const userSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    phoneNumber: { type: String },
    role: { type: String, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);
userSchema.index({ email: 1 }, { unique: true });

const UserValidationSchema = z.object({
  firstName: z.string().min(1).max(255),
  lastName: z.string().min(1).max(255),
  email: z.string().email(),
  password: z.string(),
  phoneNumber: z
    .string()
    .refine((val) => phoneregex.test(val), {
      message: "Invalid phone number format",
    })
    .optional(),
  role: z.string().min(1).max(255).optional(),
  active: z.boolean().optional(),
});

/**
 * @typedef {import("mongoose").Model<User>} User
 * @typedef {typeof User.schema.obj} UserType
 */
const User = mongoose.model("User", userSchema);

module.exports = { User, UserValidationSchema };
