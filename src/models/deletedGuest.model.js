const { default: mongoose } = require("mongoose");
const logger = require("../configs/winston.config");
const Schema = mongoose.Schema;

const deletedGuestSchema = new Schema(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    countryCode: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    source: { type: String },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    confirmationNumber: { type: String },
    roomNumber: { type: String },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String },
    active: { type: Boolean, default: true },
    expiry: { type: Date, expiresAfterSeconds: 60 * 60 * 24, required: true },
  },
  { timestamps: true },
);

/**
 * @typedef {import("mongoose").Model<DeletedGuest>} DeletedGuest
 * @typedef {typeof DeletedGuest.schema.obj} DeletedGuestType
 */
const DeletedGuest = mongoose.model("DeletedGuest", deletedGuestSchema);

DeletedGuest.init().then(() => {
  logger.info("Initialized DeletedGuest Model");
});

module.exports = { DeletedGuest };
