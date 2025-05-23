const { QrCodeScan } = require("../models/qrCodeScan.model");

const create = async (propertyId, roomNumber, session) => {
  const qrCodeScan = new QrCodeScan({
    propertyId,
    roomNumber,
  });
  const savedQrCodeScan = await qrCodeScan.save({ session });
  return savedQrCodeScan;
};

module.exports = { create };
