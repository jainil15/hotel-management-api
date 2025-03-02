const { QrCodeScan } = require("../models/qrCodeScan.model");
const { Guest } = require("../models/guest.model");
const { HouseKeepingRequest } = require("../models/houseKeepingRequest.model");
const mongoose = require("mongoose");
const { GUEST_CURRENT_STATUS } = require("../constants/guestStatus.contant");

const getAnalytics = async (propertyId) => {
  const totalRoomsOccupiedPipeline = [
    {
      $match: {
        propertyId: new mongoose.Types.ObjectId(propertyId),
        checkIn: { $lte: new Date() },
        checkOut: { $gte: new Date() },
      },
    },
    {
      $lookup: {
        from: "gueststatuses",
        localField: "_id",
        foreignField: "guestId",
        as: "status",
      },
    },
    {
      $unwind: "$status",
    },
    {
      $match: {
        "status.currentStatus": {
          $in: [GUEST_CURRENT_STATUS.IN_HOUSE, GUEST_CURRENT_STATUS.RESERVED],
        },
      },
    },
    {
      $group: {
        _id: "$roomNumber",
      },
    },
    {
      $count: "total",
    },
  ];

  const totalQrCodeScanPipeline = [
    {
      $match: {
        propertyId: new mongoose.Types.ObjectId(propertyId),
      },
    },
    {
      $match: {
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59)),
        },
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: 1,
        },
      },
    },
  ];

  const totalHouseKeepingRequestPipeline = [
    {
      $match: {
        propertyId: new mongoose.Types.ObjectId(propertyId),
      },
    },
    {
      $match: {
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59)),
        },
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: 1,
        },
      },
    },
  ];

  let totalRoomsOccupied = await Guest.aggregate(totalRoomsOccupiedPipeline);
  let totalQrCodeScan = await QrCodeScan.aggregate(totalQrCodeScanPipeline);
  let totalHouseKeepingRequest = await HouseKeepingRequest.aggregate(
    totalHouseKeepingRequestPipeline,
  );
  totalRoomsOccupied =
    totalRoomsOccupied.length > 0 ? totalRoomsOccupied[0].total : 0;
  totalQrCodeScan = totalQrCodeScan.length > 0 ? totalQrCodeScan[0].total : 0;
  totalHouseKeepingRequest =
    totalHouseKeepingRequest.length > 0 ? totalHouseKeepingRequest[0].total : 0;

  return {
    qrCodeScan: totalQrCodeScan,
    guest: totalRoomsOccupied,
    houseKeepingRequest: totalHouseKeepingRequest,
  };
};

module.exports = {
  getAnalytics,
};
