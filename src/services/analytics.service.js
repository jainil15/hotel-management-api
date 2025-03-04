const { QrCodeScan } = require("../models/qrCodeScan.model");
const { Guest } = require("../models/guest.model");
const { HouseKeepingRequest } = require("../models/houseKeepingRequest.model");
const { AddOnsRequest } = require("../models/addOnsRequest.model");
const { CheckInOutRequest } = require("../models/checkInOutRequest.model");

const mongoose = require("mongoose");
const {
  GUEST_CURRENT_STATUS,
  REQUEST_STATUS,
} = require("../constants/guestStatus.contant");

/**
 * Get analytics for a property
 * @param {string} propertyId - property id
 * @returns {object} - analytics data
 */
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

  const totalCheckInOutRequestPipeline = [
    {
      $match: {
        propertyId: new mongoose.Types.ObjectId(propertyId),
      },
    },
    {
      $match: {
        requestStatus: REQUEST_STATUS.REQUESTED,
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
  const totalAddOnsRequestPipeline = [
    {
      $match: {
        propertyId: new mongoose.Types.ObjectId(propertyId),
      },
    },
    {
      $match: {
        requestStatus: REQUEST_STATUS.REQUESTED,
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
        requestStatus: REQUEST_STATUS.REQUESTED,
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

  const totalInHouseGuestPipeline = [
    {
      $match: {
        propertyId: new mongoose.Types.ObjectId(propertyId),
      },
    },
    {
      $match: {
        checkIn: { $lte: new Date() },
        checkOut: { $gte: new Date() },
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

  let totalRoomsOccupied = await Guest.aggregate(totalRoomsOccupiedPipeline);
  let totalQrCodeScan = await QrCodeScan.aggregate(totalQrCodeScanPipeline);
  let totalHouseKeepingRequest = await HouseKeepingRequest.aggregate(
    totalHouseKeepingRequestPipeline,
  );
  let totalCheckInOutRequest = await CheckInOutRequest.aggregate(
    totalCheckInOutRequestPipeline,
  );
  let totalAddOnsRequest = await AddOnsRequest.aggregate(
    totalAddOnsRequestPipeline,
  );
  let totalInHouseGuest = await Guest.aggregate(totalInHouseGuestPipeline);
  totalRoomsOccupied =
    totalRoomsOccupied.length > 0 ? totalRoomsOccupied[0].total : 0;
  totalQrCodeScan = totalQrCodeScan.length > 0 ? totalQrCodeScan[0].total : 0;
  totalHouseKeepingRequest =
    totalHouseKeepingRequest.length > 0 ? totalHouseKeepingRequest[0].total : 0;
  totalCheckInOutRequest =
    totalCheckInOutRequest.length > 0 ? totalCheckInOutRequest[0].total : 0;
  totalAddOnsRequest =
    totalAddOnsRequest.length > 0 ? totalAddOnsRequest[0].total : 0;
  totalInHouseGuest =
    totalInHouseGuest.length > 0 ? totalInHouseGuest[0].total : 0;

  return {
    totalQrCodeScan,
    totalServicesRequest: totalAddOnsRequest + totalCheckInOutRequest,
    totalHouseKeepingRequest,
    totalInHouseGuest,
  };
};

/**
 * Get qr code scanned per room for a property
 * @param {string} propertyId - property id
 * @param {string} date - date
 * @returns {object} - analytics data
 */
const getQrCodeScannedPerRoom = async (propertyId, date) => {
  const qrCodeScannedPerRoomPipeline = [
    {
      $match: {
        propertyId: new mongoose.Types.ObjectId(propertyId),
      },
    },
    {
      $match: {
        createdAt: {
          $gte: new Date(date),
          $lt: new Date(new Date(date).setHours(23, 59, 59)),
        },
      },
    },
    {
      $match: {
        roomNumber: { $ne: null },
      },
    },
    {
      $group: {
        _id: "$roomNumber",
        total: {
          $sum: 1,
        },
      },
    },
    {
      $project: {
        _id: 0,
        roomNumber: "$_id",
        total: 1,
      },
    },
  ];
  const qrCodeScannedPerRoom = await QrCodeScan.aggregate(
    qrCodeScannedPerRoomPipeline,
  );
  return qrCodeScannedPerRoom;
};

/**
 * Get house keeping per room for a property
 * @param {string} propertyId - property id
 * @param {string} date - date
 * @returns {object} - analytics data
 */
const getHouseKeepingRequestPerRoom = async (propertyId, date) => {
  const houseKeepingRequestPerRoomPipeline = [
    {
      $match: {
        propertyId: new mongoose.Types.ObjectId(propertyId),
      },
    },
    {
      $match: {
        createdAt: {
          $gte: new Date(date),
          $lt: new Date(new Date(date).setHours(23, 59, 59)),
        },
      },
    },
    {
      $match: {
        requestStatus: REQUEST_STATUS.REQUESTED,
      },
    },
    {
      $lookup: {
        from: "guests",
        localField: "guestId",
        foreignField: "_id",
        as: "guest",
      },
    },
    {
      $unwind: "$guest",
    },
    {
      $project: {
        roomNumber: "$guest.roomNumber",
      },
    },
    {
      $match: {
        roomNumber: { $ne: null },
      },
    },
    {
      $group: {
        _id: "$roomNumber",
        total: {
          $sum: 1,
        },
      },
    },
    {
      $project: {
        _id: 0,
        roomNumber: "$_id",
        total: 1,
      },
    },
  ];
  const houseKeepingRequestPerRoom = await HouseKeepingRequest.aggregate(
    houseKeepingRequestPerRoomPipeline,
  );
  return houseKeepingRequestPerRoom;
};

const getAddOnsRequestPerRoom = async (propertyId, date) => {
  const addOnsRequestPerRoomPipeline = [
    {
      $match: {
        propertyId: new mongoose.Types.ObjectId(propertyId),
      },
    },
    {
      $match: {
        createdAt: {
          $gte: new Date(date),
          $lt: new Date(new Date(date).setHours(23, 59, 59)),
        },
      },
    },
    {
      $match: {
        requestStatus: REQUEST_STATUS.REQUESTED,
      },
    },
    {
      $lookup: {
        from: "guests",
        localField: "guestId",
        foreignField: "_id",
        as: "guest",
      },
    },
    {
      $unwind: "$guest",
    },
    {
      $project: {
        roomNumber: "$guest.roomNumber",
      },
    },
    {
      $match: {
        roomNumber: { $ne: null },
      },
    },
    {
      $group: {
        _id: "$roomNumber",
        total: {
          $sum: 1,
        },
      },
    },
    {
      $project: {
        _id: 0,
        roomNumber: "$_id",
        total: 1,
      },
    },
  ];
  const addOnsRequestPerRoom = await AddOnsRequest.aggregate(
    addOnsRequestPerRoomPipeline,
  );
  return addOnsRequestPerRoom;
};

const getCheckInOutRequestPerRoom = async (propertyId, date) => {
  const checkInOutRequestPerRoomPipeline = [
    {
      $match: {
        propertyId: new mongoose.Types.ObjectId(propertyId),
      },
    },
    {
      $match: {
        createdAt: {
          $gte: new Date(date),
          $lt: new Date(new Date(date).setHours(23, 59, 59)),
        },
      },
    },
    {
      $match: {
        requestStatus: REQUEST_STATUS.REQUESTED,
      },
    },
    {
      $lookup: {
        from: "guests",
        localField: "guestId",
        foreignField: "_id",
        as: "guest",
      },
    },
    {
      $unwind: "$guest",
    },
    {
      $project: {
        roomNumber: "$guest.roomNumber",
      },
    },
    {
      $match: {
        roomNumber: { $ne: null },
      },
    },
    {
      $group: {
        _id: "$roomNumber",
        total: {
          $sum: 1,
        },
      },
    },
    {
      $project: {
        _id: 0,
        roomNumber: "$_id",
        total: 1,
      },
    },
  ];
  const checkInOutRequestPerRoom = await CheckInOutRequest.aggregate(
    checkInOutRequestPerRoomPipeline,
  );
  return checkInOutRequestPerRoom;
};

const getCurrentInHouseGuests = async (propertyId, date) => {
  const currentInHouseGuestPipeline = [
    {
      $match: {
        propertyId: new mongoose.Types.ObjectId(propertyId),
      },
    },
    {
      $match: {
        checkIn: { $lte: new Date(date) },
        checkOut: { $gte: new Date(date) },
      },
    },
  ];

  const currentInHouseGuests = await Guest.aggregate(
    currentInHouseGuestPipeline,
  );
  return currentInHouseGuests;
};

module.exports = {
  getAnalytics,
  getQrCodeScannedPerRoom,
  getHouseKeepingRequestPerRoom,
  getAddOnsRequestPerRoom,
  getCheckInOutRequestPerRoom,
  getCurrentInHouseGuests,
};
