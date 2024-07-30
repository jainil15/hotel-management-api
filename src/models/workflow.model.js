const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const workflowSchema = new Schema(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },

    steps: [
      {
        name: { type: String, required: true },
        type: { type: String, required: true },
        enabled: { type: Boolean, default: true },
        messageTemplateId: {
          type: Schema.Types.ObjectId,
          ref: "MessageTemplate",
        },
        flowIds: [{ type: Schema.Types.ObjectId, ref: "Flow" }],
      },
    ],
  },
  { timestamps: true }
);
