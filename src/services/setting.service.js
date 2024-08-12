const { Setting } = require("../models/setting.model");

const getByPropertyId = async (propertyId) => {
  const setting = await Setting.findOne({
    propertyId: propertyId,
  });
  return setting;
};

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
const create = async (propertyId, setting, session) => {
  const newSetting = new Setting({
    ...setting,
    propertyId: propertyId,
  });

  const savedSetting = await newSetting.save({ session: session });
  return savedSetting;
};

module.exports = { create, update, getByPropertyId };
