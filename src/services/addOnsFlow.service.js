const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const { awsS3Config } = require("../configs/aws.config");
const { AddOnsFlow } = require("../models/addOnsFlow.model");

/**
 * Get AddOnsFlow by propertyId
 * @param {string} propertyId - Id of the
 * @returns {Promise<import('../models/addOnsFlow.model.js').AddOnsFlowType>} - The AddOnsFlow object
 */
const getByPropertyId = async (propertyId) => {
  const addOnsFlow = await AddOnsFlow.findOne({
    propertyId,
  });
  return addOnsFlow;
};

const create = async (propertyId, addOnsFlow, session) => {
  const newAddOnsFlow = new AddOnsFlow({
    propertyId,
    ...addOnsFlow,
  });
  await newAddOnsFlow.save({
    session,
  });
  return newAddOnsFlow;
};

const updateToDefault = async (propertyId, addOnsFlow, session) => {
  const updatedAddOnsFlow = await AddOnsFlow.findOneAndUpdate(
    { propertyId },
    addOnsFlow,
    { new: true, session },
  );
  return updatedAddOnsFlow;
};

const update = async (propertyId, addOnsFlow, session, files) => {
  const client = new S3Client(awsS3Config);
  const updatedAddOns = { ...addOnsFlow };
  // console.log("Updated", addOnsFlow);

  updatedAddOns.customAddOns = await Promise.all(
    addOnsFlow.customAddOns.map(async (addOn, index) => {
      console.log("Checking", addOn);

      // Check if there's a new file upload for this add-on
      const file = files.find((f) => f.fieldname === `addOn_${index}`);

      if (file) {
        // New file uploaded, process it
        const uploadParams = {
          Bucket: process.env.S3_IMAGES_BUCKET_NAME,
          Key: `addOns/${propertyId}/${file.originalname}`,
          Body: file.buffer,
          ContentType: file.mimetype,
        };
        try {
          const command = new PutObjectCommand(uploadParams);
          await client.send(command);
          addOn.image = `https://${process.env.S3_IMAGES_BUCKET_NAME}.s3.amazonaws.com/addOns/${propertyId}/${file.originalname}`;
        } catch (error) {
          console.error("Error uploading file to S3:", error);
          throw new Error("Failed to upload image to S3.");
        }
      } else if (addOn.image) {
        addOn.image = addOn.image;
      }

      // Remove frontend-specific properties
      // delete addOn.hasImage;
      // delete addOn.imageKey;
      // delete addOn.imageRemoved;
      // delete addOn.previewUrl;

      return addOn;
    }),
  );

  const updatedAddOnsFlow = await AddOnsFlow.findOneAndUpdate(
    { propertyId },
    updatedAddOns,
    { new: true, session },
  );
  return updatedAddOnsFlow;
};

const remove = async (propertyId, session) => {
  await AddOnsFlow.deleteOne(
    {
      propertyId,
    },
    { session },
  );
};

/**
 * @param {string} propertyId - Id of the property
 * @param {addOnsId} addOnsId - Id of the addOns
 * @returns {Promise<import('../models/addOnsFlow.model').CustomAddOnsType>}
 */
const findOneAddOn = async (propertyId, addOnsId) => {
  const addOnsFlow = await AddOnsFlow.findOne({
    propertyId,
  });
  let addOn;
  addOn = addOnsFlow.customAddOns.find(
    (addOns) => addOns._id.toString() === addOnsId,
  );
  if (addOn) {
    return addOn;
  }
  addOn = addOnsFlow.checkInOutAddOns.find(
    (addOns) => addOns._id.toString() === addOnsId,
  );
  addOn = addOnsFlow.houseKeepingAddOns.find(
    (addOns) => addOns._id.toString() === addOnsId,
  );
  return addOn;
};

module.exports = {
  getByPropertyId,
  create,
  remove,
  update,
  findOneAddOn,
  updateToDefault,
};
