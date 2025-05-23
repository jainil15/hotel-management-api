const mongoose = require("mongoose");
const logger = require("../configs/winston.config");
const Schema = mongoose.Schema;

const extraUserDetailsSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    howDidYouHearAboutUs: { type: String },
  },
  { timestamps: true },
);

extraUserDetailsSchema.index({ userId: 1 }, { unique: true });

/**
 * @typedef {import("mongoose").Model<ExtraUserDetails>} ExtraUserDetails
 * @typedef {typeof ExtraUserDetails.schema.obj} ExtraUserDetailsType
 */
const ExtraUserDetails = mongoose.model(
  "ExtraUserDetails",
  extraUserDetailsSchema,
);
ExtraUserDetails.init().then(() => {
  logger.info("Initialized ExtraUserDetails Model");
});
module.exports = ExtraUserDetails;
