const logger = require("../configs/winston.config");

const Schema = require("mongoose").Schema;

const qrCodeScanSchema = new Schema(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    roomNumber: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

const QrCodeScan = require("mongoose").model("QrCodeScan", qrCodeScanSchema);

/**
 * @typedef {import("mongoose").Model<QrCodeScan>} QrCodeScan
 * @typedef {typeof QrCodeScan.schema.obj} QrCodeScanType
 */

QrCodeScan.init().then(() => {
  logger.info("Initialized QrCodeScan Model");
});

module.exports = { QrCodeScan };
