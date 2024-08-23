const { awsS3Config } = require("../configs/aws.config");
const { PreArrival } = require("../models/preArrival.model");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
/**
 * Create a new pre arrival
 * @param {string} propertyId - The property id
 * @param {string} guestId - The guest id
 * @param {object} preArrival - The pre arrival object
 * @param {object} session - The mongoose session
 * @returns {Promise<import('../models/preArrival.model').PreArrivalType>} - The new pre arrival
 */
const create = async (propertyId, guestId, preArrival, session) => {
  if (preArrival.guestSignature) {
    const guestSignature = preArrival.guestSignature[0];
    const guestSignatureUrl = `https://${process.env.S3_IMAGES_BUCKET_NAME}.s3.amazonaws.com/property/${propertyId}/guest/${guestId}/signature/${guestSignature.originalname}`;
    preArrival.guestSignatureUrl = guestSignatureUrl;
  }
  if (preArrival.guestIdProof) {
    const guestIdProof = preArrival.guestIdProof[0];
    const guestIdProofUrl = `https://${process.env.S3_IMAGES_BUCKET_NAME}.s3.amazonaws.com/property/${propertyId}/guest/${guestId}/guestIdProof/${guestIdProof.originalname}`;
    preArrival.guestIdProofUrl = guestIdProofUrl;
  }

  const newPreArrival = new PreArrival({
    guestId,
    propertyId,
    ...preArrival,
  });
  await newPreArrival.save({ session: session });

  const client = new S3Client(awsS3Config);
  if (preArrival.guestSignature) {
    const guestSignature = preArrival.guestSignature[0];
    const guestSignatureCommand = new PutObjectCommand({
      Bucket: process.env.S3_IMAGES_BUCKET_NAME,
      Key: `property/${propertyId}/guest/${guestId}/signature/${guestSignature.originalname}`,
      Body: guestSignature.buffer,
    });
    await client.send(guestSignatureCommand);
  }

  if (preArrival.guestIdProof) {
    const guestIdProof = preArrival.guestIdProof[0];
    const guestIdProofCommand = new PutObjectCommand({
      Bucket: process.env.S3_IMAGES_BUCKET_NAME,
      Key: `property/${propertyId}/guest/${guestId}/guestIdProof/${guestIdProof.originalname}`,
      Body: guestIdProof.buffer,
    });
    await client.send(guestIdProofCommand);
  }
  return newPreArrival;
};

/**
 * Get pre arrival by id
 * @param {string} preArrivalId - The pre arrival id
 * @returns {Promise<import('../models/preArrival.model').PreArrivalType>} - The pre arrival
 */
const getById = async (preArrivalId) => {
  const preArrival = await PreArrival.findById(preArrivalId);
  return preArrival;
};

const getByPropertyId = async (propertyId) => {
  const preArrivals = await PreArrival.find({ propertyId });
  return preArrivals;
};

const getByGuestId = (guestId) => {
  const preArrival = PreArrival.findOne({ guestId });
  return preArrival;
};

const update = async (preArrivalId, preArrival, session) => {
  const updatedPreArrival = await PreArrival.findByIdAndUpdate(
    preArrivalId,
    preArrival,
    { new: true, session: session },
  );
  return updatedPreArrival;
};

const remove = async (preArrivalId, session) => {
  const preArrival = await PreArrival.findByIdAndDelete(preArrivalId, {
    session: session,
  });

  return preArrival;
};

module.exports = {
  create,
  getById,
  getByGuestId,
  update,
  remove,
  getByPropertyId,
};
