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
          name: "Breakfast Included",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/breakfast.jpeg",
        },
        {
          name: "24/7 Front Desk",
          enabled: false,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/breakfast.jpeg",
        },
        {
          name: "Free WiFi",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/free-wifi.jpg",
        },
        {
          name: "HouseKeeping",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/roomservice.jpeg",
        },
        {
          name: "Air conditioning",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/ac.jpeg",
        },
        {
          name: "Parking Available",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/parkingg.jpg",
        },
        {
          name: "Luggage Storage",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/luggagestorage.jpeg",
        },
        {
          name: "Room Service",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/roomservice.jpeg",
        },
        {
          name: "Fitness Center/Gym",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/gym.jpeg",
        },
        {
          name: "Swimming Pool",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/swimming.jpeg",
        },
        {
          name: "Business Center",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/business.jpeg",
        },
        {
          name: "On-site Restaurant/Bar",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/restaurant.jpeg",
        },
        {
          name: "Concierge Service",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/conceirge.jpeg",
        },
        {
          name: "Parking (Free or Paid)",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/parking.jpg",
        },
        {
          name: "Air Conditioning/Heating",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/ACC.jpg",
        },
        {
          name: "Laundry Services",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/laundry.jpeg",
        },
        {
          name: "Airport Shuttle Service",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/spaceshuttle.jpeg",
        },
        {
          name: "Pet-friendly Accommodations",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/DALL%C2%B7E+2024-10-17+23.45.17+-+An+icon+of+a+paw+print+with+a+small+heart%2C+representing+'Pet-friendly+Accommodations'+on+a+light+background.webp",
        },
        {
          name: "In-room Safe",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/insafe.jpeg",
        },
        {
          name: "Mini-bar",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/minibar.jpg",
        },
        {
          name: "Spa/Wellness Center",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/spa.jpeg",
        },
        {
          name: "Conference/Meeting Rooms",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/conference.jpg",
        },
        {
          name: "Cable/Satellite TV",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/tv.jpg",
        },
        {
          name: "Coffee/Tea Maker in Room",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/coffee.jpg",
        },
        {
          name: "Hairdryer and Toiletries",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/9b82408e-8d56-4625-864f-ce7b58fba899.jpeg",
        },
        {
          name: "Iron/Ironing Board",
          enabled: true,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/iron.jpg",
        },
        {
          name: "Wheelchair Accessibility",
          enabled: false,
          image:
            "https://onelyk-images-bucket.s3.amazonaws.com/amenities/wheel.jpeg",
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
