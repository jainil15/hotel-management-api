const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const settingSchema = new Schema(
  {
    propertyId: { type: Schema.Types.ObjectId, required: true },
    timeZone: { type: String, required: true },
    defaultCheckinTime: { type: String, required: true },
    defaultCheckoutTime: { type: String, required: true },
    automaticNewDay: { type: Boolean, required: true },
    defaultNewDayTime: { type: Date, required: true },
    manualNewDay: { type: Date, required: true },
    automateMessageOnStatusUpdate: { type: Boolean, required: true },
    automateEarlyCheckinMessage: { type: String, required: true },
    automateLateCheckoutMessage: { type: String, required: true },
  },
  { timeseries: true }
);

const Setting = mongoose.model("Setting", settingSchema);
module.exports = Setting;
