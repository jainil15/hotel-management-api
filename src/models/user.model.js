const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { z } = require("zod");
const userSchema = new Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    phone_number: { type: String, required: true },
    role: { type: String, required: true },
    active: { type: Boolean, required: true },
    propertyAccessId: [{ type: Schema.Types.ObjectId, ref: "PropertyAccess" }],
    propertyId: [{ type: Schema.Types.ObjectId, ref: "Property" }],
  },
  { timestamps: true }
);

const UserValidationSchema = z.object({
  username: z.string().min(3).max(255),
  email: z.string().email(),
  password: z.string(),
  phone_number: z.string().min(10).max(10),
  role: z.string().min(1).max(255),
  active: z.boolean(),
  propertyId: z.array(z.string()).optional(),
  propertyAccessId: z.array(z.string()).optional(),
});

const User = mongoose.model("User", userSchema);

module.exports = { User, UserValidationSchema };
