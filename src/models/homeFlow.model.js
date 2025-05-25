const { default: mongoose } = require("mongoose");
const { z } = require("zod");
const logger = require("../configs/winston.config");

const Schema = require("mongoose").Schema;
const amenitiesSchema = new Schema(
  {
    name: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    image: { type: String, required: true },
  },
  { _id: false },
);
const frequentlyAskedQuestionsSchema = new Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: false },
);
const homeFlowSchema = new Schema(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    amenities: {
      type: [amenitiesSchema],
      default: [
        {
          name: "Free Wi-Fi",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/v2/Free-Wi-Fi.png",
        },
        {
          name: "Complimentary Breakfast",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/v2/Complimentary-Breakfast.png",
        },
        {
          name: "Room Service",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/v2/Room-Service.png",
        },
        {
          name: "Fitness Center/Gym",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/v2/Fitness-Center-Gym.png",
        },
        {
          name: "Swimming Pool",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/v2/Swimming-Pool.png",
        },
        {
          name: "Business Center",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/v2/Business-Center.png",
        },
        {
          name: "On-Site Restaurant/Bar",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/v2/On-Site-Restaurant-Bar.png",
        },
        {
          name: "Concierge Service",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/v2/Concierge-Service.png",
        },
        {
          name: "Parking (Free or Paid)",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/v2/Parking-Free-or-Paid.png",
        },
        {
          name: "Air Conditioning/Heating",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/v2/Air-Conditioning-Heating.png",
        },
        {
          name: "24-Hour Front Desk",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/v2/24-Hour-Front-Desk.png",
        },
        {
          name: "Laundry Services",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/v2/Laundry-Services.png",
        },
        {
          name: "Airport Shuttle Service",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/v2/Airport-Shuttle-Service.png",
        },
        {
          name: "Pet-Friendly Accommodations",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/v2/Pet-Friendly-Accommodations.png",
        },
        {
          name: "Mini-Bar",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/v2/Mini-Bar.png",
        },
        {
          name: "Spa/Wellness Center",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/v2/Spa-Wellness-Center.png",
        },
        {
          name: "Cable/Satellite TV",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/v2/Cable-Satellite-TV.png",
        },
        {
          name: "Luggage Storage",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/v2/Luggage-Storage.png",
        },
        {
          name: "Wheelchair Accessibility",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/v2/Wheelchair-Accessibility.png",
        },
        {
          name: "Microwave",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/v2/Microwave.png",
        },
        {
          name: "Refrigrator",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/v2/Refrigrator.png",
        },
      ],
    },
    frequentlyAskedQuestionsEnabled: { type: Boolean, default: true },
    frequentlyAskedQuestions: {
      type: [frequentlyAskedQuestionsSchema],
      default: [
        {
          question: "What time is standard check in?",
          answer: "Check-out is at 3:00 PM.",
        },
      ],
    },
  },
  { timestamps: true },
);

homeFlowSchema.index({ propertyId: 1 }, { unique: true });

/**
 * @typedef {import("mongoose").Model<HomeFlow>} HomeFlow
 * @typedef {typeof HomeFlow.schema.obj} HomeFlowType
 */
const HomeFlow = mongoose.model("HomeFlow", homeFlowSchema);

const CreateHomeFlowValidationSchema = z.object({
  amenities: z.array({
    name: z.string(),
    enabled: z.boolean(),
    image: z.string(),
  }),
  frequentlyAskedQuestionsEnabled: z.boolean().optional(),
  frequentlyAskedQuestions: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    }),
  ),
});

const UpdateHomeFlowValidationSchema = z.object({
  amenities: z
    .array(
      z.object({
        name: z.string().optional(),
        enabled: z.boolean().optional(),
        image: z.string().optional(),
      }),
    )
    .optional(),
  frequentlyAskedQuestionsEnabled: z.boolean().optional(),
  frequentlyAskedQuestions: z
    .array(
      z.object({
        question: z.string().optional(),
        answer: z.string().optional(),
      }),
    )
    .optional(),
});
HomeFlow.init().then(() => {
  logger.info("Initialized HomeFlow Model");
});
module.exports = {
  HomeFlow,
  frequentlyAskedQuestionsSchema,
  UpdateHomeFlowValidationSchema,
  CreateHomeFlowValidationSchema,
};
