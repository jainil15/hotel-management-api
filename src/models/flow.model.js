const { default: mongoose } = require("mongoose");
const { boolean, z } = require("zod");

const Schema = mongoose.Schema;

const flowSchema = new Schema(
	{
		propertyId: {
			type: Schema.Types.ObjectId,
			ref: "Property",
			required: true,
		},
		messageTemplateId: {
			type: Schema.Types.ObjectId,
			ref: "MessageTemplate",
			required: true,
		},
		trigger: {
			type: String,
			required: true,
		},
		name: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			required: true,
		},
		timeDelay: {
			type: Number,
			required: true,
		},
		flowStatus: {
			type: Boolean,
			default: true,
		},
	},
	{ timestamps: true },
);

flowSchema.index({ propertyId: 1, name: 1 }, { unique: true });

const CreateFlowSchemaValidation = z.object({
	propertyId: z.string(),
	messageTemplateId: z.string(),
	trigger: z.string(),
	name: z.string(),
	description: z.string(),
	timeDelay: z.number(),
});

const UpdateFlowSchemaValidation = z.object({
	messageTemplateId: z.string().optional(),
	trigger: z.string().optional(),
	name: z.string().optional(),
	description: z.string().optional(),
	timeDelay: z.number().optional(),
	flowStatus: z.boolean().optional(),
});

/**
 * @typedef {import("mongoose").Model<Flow>} Flow
 * @typedef {typeof Flow.schema.obj} FlowType
 */
const Flow = mongoose.model("Flow", flowSchema);

module.exports = {
	Flow,
	CreateFlowSchemaValidation,
	UpdateFlowSchemaValidation,
};
