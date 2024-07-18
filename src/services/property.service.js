const mongoose = require("mongoose");
const FeatureAccess = require("../models/featureaccess.model");
const { Property } = require("../models/property.model");
const PropertyAccess = require("../models/propertyaccess.model");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { awsS3Config, awsConfig } = require("../configs/aws.config");
const fs = require("fs");
const { TwilioAccount } = require("../models/twilioAccount.model");
const twilio = require("twilio");
const { Setting } = require("../models/setting.model");
require("dotenv").config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = require("twilio")(accountSid, authToken);

const create = async (property, files, user, setting) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    
    const logo = files.logo[0];
    const cover = files.cover[0];

    const newProperty = new Property({
      ...property,
    });
    const logoUrl = `https://${process.env.S3_IMAGES_BUCKET_NAME}.s3.amazonaws.com/property/${newProperty._id}/logo/${logo.originalname}`;
    const coverUrl = `https://${process.env.S3_IMAGES_BUCKET_NAME}.s3.amazonaws.com/property/${newProperty._id}/cover/${cover.originalname}`;

    const newPropertyAcess = new PropertyAccess({
      propertyId: newProperty._id,
      userId: user._id,
      role: user.role,
    });
    // add { session }
    await newPropertyAcess.save({ session });

    const savedProperty = await newProperty.save({ session });
    savedProperty.logoUrl = logoUrl;
    savedProperty.coverUrl = coverUrl;
    await savedProperty.save();

    // save Settings
    const newSetting = new Setting({
      propertyId: savedProperty._id,
      ...setting,
    });
    await newSetting.save({ session });

    // Upload to s3
    const client = new S3Client(awsS3Config);
    const logoCommand = new PutObjectCommand({
      Bucket: process.env.S3_IMAGES_BUCKET_NAME,
      Key: `property/${newProperty._id}/logo/${logo.originalname}`,
      Body: logo.buffer,
    });
    const coverCommand = new PutObjectCommand({
      Bucket: process.env.S3_IMAGES_BUCKET_NAME,
      Key: `property/${newProperty._id}/cover/${cover.originalname}`,
      Body: cover.buffer,
    });
    await client.send(logoCommand);
    await client.send(coverCommand);
    
    await session.commitTransaction();
    session.endSession();
    return savedProperty;
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    throw new Error("Error creating property" + e);
  }
};

const getAll = async (user) => {
  try {
    const propertyAccess = await PropertyAccess.find({
      userId: user._id,
    }).populate("propertyId");

    const properties = propertyAccess.map((access) => access.propertyId);
    return properties;
  } catch (e) {
    throw new Error("Error getting properties" + e);
  }
};

const update = async (property, propertyId) => {
  try {
    const updatedProperty = await Property.findByIdAndUpdate(
      propertyId,
      property,
      { new: true }
    );
    return updatedProperty;
  } catch (e) {
    throw new Error("Error updating property" + e);
  }
};

const remove = async (propertyId) => {
  try {
    const removedProperty = await Property.findByIdAndDelete(propertyId);
    const _propertyAccess = await PropertyAccess.findOneAndDelete({
      propertyId: propertyId,
    });
    return removedProperty;
  } catch (e) {
    throw new Error("Error deleting property " + e);
  }
};

const getById = async (propertyId) => {
  try {
    const property = await Property.findById(propertyId);
    if (!property) {
      throw new Error("Property not found");
    }
    return property;
  } catch (e) {
    throw new Error("Error getting property by id" + e);
  }
};

const getByEmail = async (email) => {
  try {
    const property = await Property.findOne({
      email: email,
    });
    
    return property;
  } catch (e) {
    throw new Error("Error getting property by email");
  }
};
module.exports = { create, getAll, update, remove, getById, getByEmail };
