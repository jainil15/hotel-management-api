const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { z } = require("zod");

/**
 * @openapi
 * components:
 *  schemas:
 *    User:
 *      properties:
 *        id:
 *          type: string
 *          description: Unique identifier
 *        firstName:
 *          type: string
 *          description: First name of the user
 *        lastName:
 *          type: string
 *          description: Last name of the user
 *        email:
 *          type: string
 *          description: Email of the user
 *        phoneNumber:
 *          type: string
 *          description: Phone number of the user
 *        role:
 *          type: string
 *          description: Role of the user
 *        active:
 *          type: boolean
 *          description: Status of the user
 *        createdAt:
 *          type: string
 *          format: date-time
 *          description: Date and time of the user created
 *        updatedAt:
 *          type: string
 *          format: date-time
 *          description: Date and time of the user updated
 *      example:
 *        id: 60f6f6
 *        firstName: Jon
 *        lastName: Doe
 *        email: jondoe@gmail.com
 *        phoneNumber: 1234567890
 *        role: admin
 *        active: true
 *        createdAt: 2022-01-01T12:00:00Z
 *        updatedAt: 2022-01-01T12:00:00Z
 */

const userSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    phoneNumber: { type: String, required: true },
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
  phoneNumber: z.string().min(10).max(10),
  role: z.string().min(1).max(255).optional(),
  active: z.boolean().optional(),
});

const User = mongoose.model("User", userSchema);

module.exports = { User, UserValidationSchema };
