const { default: mongoose } = require("mongoose");
const logger = require("../configs/winston.config");

const Schema = require("mongoose").Schema;

const guestSessionSchema = new Schema(
  {
    guestId: { type: Schema.Types.ObjectId, ref: "Guest", required: true },
  },
  { timestamps: true }
);

guestSessionSchema.index({ guestId: 1 }, { unique: true });

const GuestSession = mongoose.model("GuestSession", guestSessionSchema);

GuestSession.init().then(() => {
  logger.info("Initialized GuestSession Model");
});

module.exports = { GuestSession };
