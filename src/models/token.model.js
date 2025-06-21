const mongoose = require("mongoose");
const logger = require("../configs/winston.config");
const crypto = require("crypto");
const Schema = mongoose.Schema;

const tokenSchema = new Schema(
  {
    token: {
      type: String,
      default: crypto.randomBytes(32).toString("hex"),
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 600000),
      expires: 600,
    },
  },
  { timestamps: true },
);

/**
 * @typedef {import("mongoose").Model<Token>} Token
 * @typedef {typeof Token.schema.obj} TokenType
 */

const Token = mongoose.model("Token", tokenSchema);
Token.init().then(() => {
  logger.info("Initialized Token Model");
});
module.exports = { Token };
