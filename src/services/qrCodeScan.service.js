const { QrCodeScan } = require("../models/qrCodeScan.model");

const create = async (propertyId, roomNumber, session) => {
  const qrCodeScan = new QrCodeScan({
    propertyId,
    roomNumber,
  });
  const savedQrCodeScan = await qrCodeScan.save({ session });
  return savedQrCodeScan;
};

const getByPropertyId = async (propertyId) => {
  const qrCodeScan = await QrCodeScan.find({ propertyId });
  return qrCodeScan;
};

module.exports = { create, getByPropertyId };
