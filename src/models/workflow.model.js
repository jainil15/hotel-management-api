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
				type: { type: String, required: true },
				name: { type: String, required: true },
				status: { type: String },
				flowIds: [{ type: Schema.Types.ObjectId, ref: "Flow" }],
			},
		],
	},
	{ timestamps: true },
);

workflowSchema.index({ propertyId: 1 }, { unique: true });

/**
 * @typedef {import("mongoose").Model<Workflow>} Workflow
 * @typedef {typeof Workflow.schema.obj} WorkflowType
 */
const Workflow = mongoose.model("Workflow", workflowSchema);
