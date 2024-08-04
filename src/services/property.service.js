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
const { NotFoundError, InternalServerError } = require("../lib/CustomErrors");
require("dotenv").config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = require("twilio")(accountSid, authToken);

/**
 * Create a new property
 * @param {object} property - Property
 * @param {object} files - Files
 * @param {object} user - User
 * @param {object} setting - Setting
 * @param {object} session - Mongoose session
 * @returns {Promise<Property>} - The saved property
 */
const create = async (property, files, user, setting, session) => {
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

		return savedProperty;
	} catch (e) {
		throw new InternalServerError("Error creating property", e.message);
	}
};

/**
 * Get all properties
 * @param {object} user - User
 * @returns {Promise<Property[]>} - The list of properties
 */
const getAll = async (user) => {
	const propertyAccess = await PropertyAccess.find({
		userId: user._id,
	}).populate("propertyId");

	const properties = propertyAccess
		.map((access) => access.propertyId)
		.filter((property) => property);
	return properties;
};

/**
 * Update a property
 * @param {object} property - The property object
 * @param {string} propertyId - The property id
 * @returns {Promise<Property>} - The updated property
 */
const update = async (property, propertyId) => {
	const updatedProperty = await Property.findByIdAndUpdate(
		propertyId,
		property,
		{ new: true },
	);
	return updatedProperty;
};

/**
 * Remove a property
 * @param {string} propertyId - The property id
 * @returns {Promise<Property>} - The removed property
 */
const remove = async (propertyId) => {
	const removedProperty = await Property.findByIdAndDelete(propertyId);
	const _propertyAccess = await PropertyAccess.findOneAndDelete({
		propertyId: propertyId,
	});
	return removedProperty;
};

/**
 * Get a property by id
 * @param {string} propertyId - The property id
 * @returns {Promise<Property>} - The property
 */
const getById = async (propertyId) => {
	const property = await Property.findById(propertyId);
	if (!property) {
		throw new NotFoundError("Property not found", {
			propertyId: ["Property not found for the given id"],
		});
	}
	return property;
};

/**
 * Get a property by email
 * @param {string} email - The email to filter property
 * @returns {Promise<Property>} - The property
 */
const getByEmail = async (email) => {
	const property = await Property.findOne({
		email: email,
	});
	return property;
};

/**
 * Find a property
 * @param {object} filter - The filter object
 * @returns {Promise<Property>} - The property
 */
const find = async (filter) => {
	const property = await Property.findOne(filter);
	return property;
};
module.exports = { create, getAll, update, remove, getById, getByEmail, find };
