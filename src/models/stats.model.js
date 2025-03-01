const Schema = require("mongoose").Schema;

const StatsSchema = new Schema(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    qrCodeScans: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const Stats = require("mongoose").model("Stats", StatsSchema);
