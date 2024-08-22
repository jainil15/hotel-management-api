const { default: mongoose } = require("mongoose");
const logger = require("../configs/winston.config");

const Schema = require("mongoose").Schema;

const guestSessionSchema = new Schema(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    guestId: { type: Schema.Types.ObjectId, ref: "Guest", required: true },
    expiry: { type: Date, expiresAfterSeconds: 60 * 60 * 24 },
  },
  { timestamps: true },
);

guestSessionSchema.index({ guestId: 1 }, { unique: true });

/**
 * @typedef {import("mongoose").Model<GuestSession>} GuestSession
 * @typedef {typeof GuestSession.schema.obj} GuestSessionType
 */
const GuestSession = mongoose.model("GuestSession", guestSessionSchema);

GuestSession.init().then(() => {
  logger.info("Initialized GuestSession Model");
});

module.exports = { GuestSession };
