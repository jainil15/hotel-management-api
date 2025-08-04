const { AddOnNotification } = require("../models/addOnNotification.model");

/**
 * Adding notification to database
 * @param {string} propertyId - Property ID
 * @param {import("../models/addOnNotification.model.js").AddOnNotificationType} addOnNotification - AddOn Notification
 * @param {object} session - Transaction session
 * @returns {Promise<import(NewType).AddOnNotificationType>} - Returns the created AddOnNotification documents
 */
const create = async (propertyId, addOnNotification, session) => {
  const newAddOnNotification = new AddOnNotification({
    ...addOnNotification,
    propertyId,
  });
  return await newAddOnNotification.save({ session });
};

/**
 * Updates an existing AddOnNotification document
 * @param {string} addOnNotificationId - The ID of the AddOnNotification to update
 * @param {import("../models/addOnNotification.model.js").AddOnNotificationType} updateData - The data to update
 * @param {object} session - Transaction session
 * @returns {Promise<import("../models/addOnNotification.model.js").AddOnNotificationType>} - Returns the updated AddOnNotification document
 */
const update = async (addOnNotificationId, updateData, session) => {
  return await AddOnNotification.findByIdAndUpdate(
    addOnNotificationId,
    updateData,
    { new: true, session },
  );
};

/**
 * Updates an existing AddOnNotification document
 * @param {string} propertyId - The ID of the AddOnNotification to update
 * @param {import("../models/addOnNotificaton.model.js.js").AddOnNotificationType} addOnNotification - The data to upsert
 * @param {object} session - Transaction session
 * @returns {Promise<import("../models/addOnNotification.model.js.js").AddOnNotificationType>} - Returns the updated AddOnNotification document
 */
const upsert = async (propertyId, addOnNotification, session) => {
  const existingNotification = await AddOnNotification.findOne({
    propertyId,
    addOnId: addOnNotification.addOnId,
  });

  if (existingNotification) {
    return await update(existingNotification._id, addOnNotification, session);
  } else {
    return await create(propertyId, addOnNotification, session);
  }
};

/**
 * Retrieves an AddOnNotification by propertyId and addOnId
 * @param {string} propertyId - The ID of the property
 * @param {string} addOnId - The ID of the add-on
 * @returns {Promise<import("../models/addOnNotification.model.js").AddOnNotifictionDetailsType>} - Returns the found AddOnNotification document or null if not found
 */
const getByAddOnId = async (propertyId, addOnId) => {
  const result = await AddOnNotification.findOne(
    {
      propertyId,
      "addOnNotifications.addOnId": addOnId,
    },
    {
      addOnNotifications: { $elemMatch: { addOnId } },
    },
  );

  return result?.addOnNotifications?.[0] || null;
};
const getByPropertyId = async (propertyId) => {
  return await AddOnNotification.findOne({ propertyId });
};
module.exports = {
  create,
  update,
  upsert,
  getByAddOnId,
  getByPropertyId,
};
