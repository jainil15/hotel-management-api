const { Setting } = require("../models/setting.model");

/**
 * Get setting by propertyId
 * @param {string} propertyId - property id
 * @returns {import('../models/setting.model').SettingType} - Setting
 */
const getByPropertyId = async (propertyId) => {
  const setting = await Setting.findOne({
    propertyId: propertyId,
  });
  return setting;
};

/**
 * Update settingId
 * @param {string} propertyId - property id
 * @param {string} settingId - setting id
 * @param {object} setting - setting object
 * @param {object} session - mongoose session
 * @returns {import('../models/setting.model').SettingType} - Updated setting
 */
const update = async (propertyId, settingId, setting, session) => {
  const updatedSetting = await Setting.findOneAndUpdate(
    {
      propertyId: propertyId,
      _id: settingId,
    },
    setting,
    { new: true, session: session },
  );
  return updatedSetting;
};

/**
 * Create setting
 * @param {string} propertyId - property id
 * @param {object} setting - setting object
 * @param {object} setting - mongoose session
 * @returns {import('../models/setting.model').SettingType} - New setting
 */
const create = async (propertyId, setting, session) => {
  const newSetting = new Setting({
    ...setting,
    propertyId: propertyId,
  });

  const savedSetting = await newSetting.save({ session: session });
  return savedSetting;
};

module.exports = { create, update, getByPropertyId };
