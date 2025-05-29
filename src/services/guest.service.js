const { default: mongoose } = require("mongoose");
const logger = require("../configs/winston.config");
const { NotFoundError } = require("../lib/CustomErrors");
const { Guest } = require("../models/guest.model");
const { GuestStatus } = require("../models/guestStatus.model");
const { DoNotDisturbRequest } = require("../models/doNotDisturb.model");
const { CheckInOutRequest } = require("../models/checkInOutRequest.model");
const { AddOnsRequest } = require("../models/addOnsRequest.model");
const { AddOnsFlow } = require("../models/addOnsFlow.model");
const addOnsFlowService = require("../services/addOnsFlow.service");
const { getByPropertyIdAndGuestId } = require("./addOnsRequest.service");
const { GUEST_CURRENT_STATUS } = require("../constants/guestStatus.contant");
const { HouseKeepingRequest } = require("../models/houseKeepingRequest.model");
/**
 * Create a new guest
 * @param {import('../models/guest.model').GuestType} guest - guest object
 * @param {string} propertyId - property id
 * @param {object} session - mongoose session
 * @returns {Promise<import('../models/guest.model').GuestType>} guest - guest objec
 */
const create = async (guest, propertyId, session) => {
  try {
    const newGuest = new Guest({ ...guest, propertyId: propertyId });
    const savedGuest = await newGuest.save({ session });
    return savedGuest;
  } catch (e) {
    throw new Error("Error while creating guest");
  }
};

/**
 * Get all guests
 * @param {string} propertyId - property id
 * @returns {Promise<import('../models/guest.model').GuestType[]>} guests - guests object
 */
const getAll = async (propertyId) => {
  const guests = await Guest.find({ propertyId: propertyId });
  return guests;
};

/**
 * Get guest by guest id
 * @param {string} guestId - guest id
 * @returns {Promise<import('../models/guest.model').GuestType>} guest - guest object
 * @throws {NotFoundError} - If guest not foundq
 */
const getByGuestId = async (guestId) => {
  const guest = await Guest.findOne({ _id: guestId });
  if (!guest) {
    throw new NotFoundError("Guest not found", {
      guestId: ["Guest not found for the given id"],
    });
  }
  return guest;
};

/**
 * Get guest by id
 * @param {string} guestId - guest id
 * @param {string} propertyId - property id @returns {Promise<import('../models/guest.model').GuestType>} guest - guest object */ const getById =
  async (guestId, propertyId) => {
    const guest = await Guest.findOne({ _id: guestId, propertyId: propertyId });
    if (!guest) {
      throw new NotFoundError("Guest not found", {
        guestId: ["Guest not found for the given id"],
      });
    }
    return guest;
  };
/**
 * Update guest
 * @param {object} guest - guest object
 * @param {string} propertyId - property id
 * @param {string} guestId - guest id
 * @param {object} session - mongoose session
 * @returns {object} updatedGuest - updated guest object
 */
const update = async (guest, propertyId, guestId, session) => {
  if (guest.checkIn) {
    guest.checkIn = new Date(guest.checkIn);
  }
  if (guest.checkOut) {
    guest.checkOut = new Date(guest.checkOut);
  }
  if (guest.extendStay) {
    guest.checkOut = new Date(guest.extendStay);
  }

  const updatedGuest = await Guest.findOneAndUpdate(
    { _id: guestId, propertyId: propertyId },
    {
      ...guest,
      propertyId: propertyId,
    },
    { session: session, new: true },
  );
  if (!updatedGuest) {
    throw new NotFoundError("Guest not found", {
      guestId: ["Guest not found for the given id"],
    });
  }
  return updatedGuest;
};

/**
 * Remove guest
 * @param {string} guestId - guest id
 * @param {string} propertyId - property id
 * @param {object} session - mongoose session
 * @returns {object} removedGuest - removed guest object
 */
const remove = async (guestId, propertyId, session) => {
  const removedGuest = await Guest.findOneAndDelete(
    {
      _id: guestId,
      propertyId: propertyId,
    },
    { session: session },
  );
  if (!removedGuest) {
    throw new NotFoundError("Guest not found", {
      guestId: ["Guest not found for the given id"],
    });
  }
  return removedGuest;
};

/**
 * Get all guests with status
 * @param {string} propertyId - property id
 * @returns {Promise<import('../models/guest.model').GuestType>} guests - guests object
 */
const getAllGuestsWithStatus = async (propertyId) => {
  const guests = await GuestStatus.find({ propertyId: propertyId }).populate(
    "guestId",
  );

  return guests.map((guest) => {
    const { guestId, ...guestStatus } = { ...guest._doc };
    return {
      ...guestId._doc,
      status: guestStatus,
    };
  });
};

/**
 * Get phone numbers of guests
 * @param {string[]} guestIds - guest ids
 * @returns {object} phoneNumbers - phone numbers object
 */
const getPhoneNumbers = async (guestIds) => {
  const phoneNumbers = await Guest.find(
    { _id: { $in: guestIds } },
    { phoneNumber: 1, countryCode: 1 },
  );
  return phoneNumbers;
};

/**
 * Find one guest
 * @param {object} filter - filter object
 * @returns {Promise<import('../models/guest.model').GuestType>} guest - guest object
 */
const find = async (filter) => {
  const guest = await Guest.findOne(filter);
  return guest;
};

/**
 * Find one guest with status
 * @param {object} guestFilter - guest filter object
 * @param {object} statusFilter - status filter object
 * @returns {Promise<import('../models/guest.model').GuestType>} guest - guest object
 */
const findWithStatus = async (guestFilter, statusFilter) => {
  const pipeline = [
    {
      $match: {
        propertyId: new mongoose.Types.ObjectId(guestFilter.propertyId),
      },
    },
    {
      $match: {
        phoneNumber: guestFilter.phoneNumber,
        countryCode: guestFilter.countryCode,
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
      $unwind: {
        path: "$status",
      },
    },
    {
      $match: {
        "status.currentStatus": statusFilter.currentStatus,
        "status.reservationStatus": statusFilter.reservationStatus,
      },
    },

    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        phoneNumber: 1,
        countryCode: 1,
        checkIn: 1,
        checkOut: 1,
        status: 1,
      },
    },
  ];

  const guest = await Guest.aggregate(pipeline);
  return guest;
};

const getGuestAddonsRequests = async (propertyId, requestStatus) => {
  const propertyAddons = await AddOnsFlow.findOne({
    propertyId: propertyId,
  }).lean();
  let checkInOutRequests;
  if (requestStatus === "all") {
    checkInOutRequests = await CheckInOutRequest.find({
      propertyId: propertyId,
    })
      .populate("guestId")
      .sort({ createdAt: -1 })
      .lean();
  } else {
    checkInOutRequests = await CheckInOutRequest.find({
      propertyId: propertyId,
      requestStatus: requestStatus,
    })
      .populate("guestId")
      .sort({ createdAt: -1 })
      .lean();
  }

  checkInOutRequests = await Promise.all(
    checkInOutRequests.map(async (req) => {
      const addOnData = propertyAddons?.checkInOutAddOns?.find(
        (addon) =>
          addon._id.toString() === req?.checkInOutRequestId?.toString(),
      );
      if (!req.guestId) {
        console.log(req);
        return req;
      }
      req.guestId.status = await GuestStatus.findOne({
        guestId: req?.guestId?._id,
      });
      return { ...req, addOnData };
    }),
  );
  let customAddonsRequests;
  if (requestStatus === "all") {
    customAddonsRequests = await AddOnsRequest.find({
      propertyId: propertyId,
    })
      .populate("guestId")
      .sort({ createdAt: -1 })
      .lean();
  } else {
    customAddonsRequests = await AddOnsRequest.find({
      propertyId: propertyId,
      requestStatus: requestStatus,
    })
      .populate("guestId")
      .sort({ createdAt: -1 })
      .lean();
  }

  customAddonsRequests = await Promise.all(
    customAddonsRequests.map(async (req) => {
      const addOnData = propertyAddons?.customAddOns?.find(
        (addon) => addon._id.toString() === req.addOnsId.toString(),
      );
      if (!req.guestId) {
        console.log(req);
        return req;
      }
      req.guestId.status = await GuestStatus.findOne({
        guestId: req.guestId._id,
      });
      return { ...req, addOnData };
    }),
  );
  let houseKeepingRequests;
  if (requestStatus === "all") {
    houseKeepingRequests = await HouseKeepingRequest.find({
      propertyId: propertyId,
    })
      .populate("guestId")
      .sort({ createdAt: -1 })
      .lean();
  } else {
    houseKeepingRequests = await HouseKeepingRequest.find({
      propertyId: propertyId,
      requestStatus: requestStatus,
    })
      .populate("guestId")
      .sort({ createdAt: -1 })
      .lean();
  }

  houseKeepingRequests = await Promise.all(
    houseKeepingRequests.map(async (req) => {
      if (!req.guestId) {
        console.log(req);
        return req;
      }
      req.guestId.status = await GuestStatus.findOne({
        guestId: req?.guestId?._id,
      });
      return { ...req };
    }),
  );

  const requests = [
    ...checkInOutRequests,
    ...customAddonsRequests,
    ...houseKeepingRequests,
  ];

  return { requests, propertyAddons };
};

const getGuestAddonsRequestsv2 = async (propertyId, requestStatus) => {
  // Pipeline for checkInOutRequests
  const checkInOutPipeline = [
    {
      $match: {
        propertyId: propertyId,
        requestStatus: requestStatus,
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: "guests",
        localField: "guestId",
        foreignField: "_id",
        as: "guest",
      },
    },
    { $unwind: "$guest" },
    {
      $lookup: {
        from: "gueststatuses",
        localField: "guestId",
        foreignField: "guestId",
        as: "guestStatus",
      },
    },
    {
      $unwind: { path: "$guestStatus", preserveNullAndEmptyArrays: true },
    },
    {
      // Lookup the AddOnsFlow document to get checkInOutAddOns for this property
      $lookup: {
        from: "addOnsFlows",
        let: { pid: "$propertyId" },
        pipeline: [
          { $match: { $expr: { $eq: ["$propertyId", "$$pid"] } } },
          { $project: { checkInOutAddOns: 1 } },
        ],
        as: "propertyAddons",
      },
    },
    {
      $addFields: {
        propertyAddons: { $arrayElemAt: ["$propertyAddons", 0] },
      },
    },
    {
      $addFields: {
        addOnData: {
          $arrayElemAt: [
            {
              $filter: {
                input: "$propertyAddons.checkInOutAddOns",
                as: "addon",
                // Compare the addon _id with the checkInOutRequestId from the request
                cond: { $eq: ["$$addon._id", "$checkInOutRequestId"] },
              },
            },
            0,
          ],
        },
      },
    },
    {
      $project: {
        propertyAddons: 0,
      },
    },
  ];

  // Pipeline for custom add‑on requests
  const customAddOnsPipeline = [
    {
      $match: {
        propertyId: propertyId,
        requestStatus: requestStatus,
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: "guests",
        localField: "guestId",
        foreignField: "_id",
        as: "guest",
      },
    },
    { $unwind: "$guest" },
    {
      $lookup: {
        from: "gueststatuses",
        localField: "guestId",
        foreignField: "guestId",
        as: "guestStatus",
      },
    },
    {
      $unwind: { path: "$guestStatus", preserveNullAndEmptyArrays: true },
    },
    {
      // Lookup the AddOnsFlow document to get customAddOns for this property
      $lookup: {
        from: "addOnsFlows",
        let: { pid: "$propertyId" },
        pipeline: [
          { $match: { $expr: { $eq: ["$propertyId", "$$pid"] } } },
          { $project: { customAddOns: 1 } },
        ],
        as: "propertyAddons",
      },
    },
    {
      $addFields: {
        propertyAddons: { $arrayElemAt: ["$propertyAddons", 0] },
      },
    },
    {
      $addFields: {
        addOnData: {
          $arrayElemAt: [
            {
              $filter: {
                input: "$propertyAddons.customAddOns",
                as: "addon",
                // Compare the addon _id with the addOnsId from the request
                cond: { $eq: ["$$addon._id", "$addOnsId"] },
              },
            },
            0,
          ],
        },
      },
    },
    {
      $project: {
        propertyAddons: 0,
      },
    },
  ];

  // Combine both pipelines using unionWith (run the first and union the second)
  const finalPipeline = [
    ...checkInOutPipeline,
    {
      $unionWith: {
        coll: "addOnsRequests", // Ensure this is the correct collection name for custom add-on requests
        pipeline: customAddOnsPipeline,
      },
    },
    // Optionally, sort the final results
    { $sort: { createdAt: -1 } },
  ];
  const requests = await AddOnsRequest.aggregate(finalPipeline);
  console.log(requests);
  return requests;
};

const createDndRequest = async (propertyId, guestId, dndmode, session) => {
  const dndRequest = new DoNotDisturbRequest({
    propertyId,
    guestId,
    requestStatus: dndmode,
  });
  const dndModeReq = await dndRequest.save({ session });
  return dndModeReq;
};
const updatedGuestDndStatus = async (
  propertyId,
  guestId,
  requestStatus,
  session,
) => {
  try {
    const guest = await Guest.findOne({ propertyId, _id: guestId }).session(
      session,
    );
    if (!guest) {
      throw new Error("Guest not found");
    }

    const status =
      requestStatus === "Accepted" ? !guest.dndmode : guest.dndmode;

    const updatedGuest = await Guest.findOneAndUpdate(
      { _id: guestId, propertyId: propertyId },
      { dndmode: status },
      { new: true, session },
    );

    return updatedGuest;
  } catch (error) {
    console.error("Error updating Guest DND status:", error.message);
    throw error;
  }
};

const getGuestDndStatus = async (propertyId, guestId) => {
  const guest = await Guest.findOne({
    _id: guestId,
    propertyId: propertyId,
  });
  return guest;
};

/**
 * Get guest by property id and guest id
 * @param {string} propertyId - property id
 * @param {string} countryCode - country code
 * @param {string} phoneNumber - phone number
 * @returns {Promise<import('../models/guest.model').GuestType>} guest - guest object
 */
const getGuestByPhoneNumber = async (propertyId, countryCode, phoneNumber) => {
  console.log(new Date());
  const pipeline = [
    {
      $match: {
        propertyId: new mongoose.Types.ObjectId(propertyId),
      },
    },
    {
      $match: {
        phoneNumber,
        countryCode,
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
      $match: {
        $or: [
          { "status.currentStatus": GUEST_CURRENT_STATUS.IN_HOUSE },
          { "status.currentStatus": GUEST_CURRENT_STATUS.RESERVED },
        ],
      },
    },
    // {
    //   $match: {
    //     checkOut: { $gte: new Date() },
    //     checkIn: { $lte: new Date() },
    //   },
    // },
    {
      $unwind: {
        path: "$status",
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        phoneNumber: 1,
        countryCode: 1,
        checkIn: 1,
        checkOut: 1,
        status: 1,
      },
    },
    {
      $sort: {
        checkIn: -1,
      },
    },
    {
      $limit: 1,
    },
  ];
  const guest = await Guest.aggregate(pipeline);
  return guest[0];
};
/**
 * Get guest by property id and guest id
 * @param {string} propertyId - property id
 * @param {string} pmsId - pms id
 * @returns {Promise<import('../models/guest.model').GuestType>} guest - guest object
 */
const getByGuestPmsId = async (propertyId, pmsId) => {
  const guest = await Guest.findOne({ propertyId: propertyId, pmsId: pmsId });
  return guest;
};

/**
 * Upsert guest
 * @param  {string } pmsId - guest Pms Id
 * @param {object} guest - guest object
 * @param {string} propertyId - property id
 * @param {object} session - mongoose session
 * @returns {Promise<import('../models/guest.model').GuestType>} guest - guest object
 */
const upsert = async (pmsId, guest, propertyId, session) => {
  console.log("pmsId", pmsId);
  const updatedGuest = await Guest.findOneAndUpdate(
    { pmsId: pmsId, propertyId: propertyId },
    {
      ...guest,
      propertyId: propertyId,
    },
    { session: session, new: true, upsert: true },
  );
  return updatedGuest;
};
/**
 * Update guest by pms id
 * @param {object} guest - guest object
 * @param {string} pmsId - pms id
 * @param {string} propertyId - property id
 * @param {object} session - mongoose session
 * @returns {Promise<import('../models/guest.model').GuestType>} guest - guest object
 */
const updateByPmsId = async (guest, pmsId, propertyId, session) => {
  const updatedGuest = await Guest.findOneAndUpdate(
    { pmsId: pmsId, propertyId: propertyId },
    { $set: { ...guest } },
    { session: session, new: true, runValidators: true },
  );
  console.log(updatedGuest);
  return updatedGuest;
};

const upsertWithRetry = async (
  propertyId,
  guestId,
  guest,
  session,
  maxRetries = 3,
) => {
  let attempt = 0;
  let result;
  while (attempt < maxRetries) {
    try {
      const existingGuest = await Guest.findOne({
        propertyId,
        _id: guestId,
      }).session(session);
      if (existingGuest) {
        result = existingGuest;
      } else {
        result = await create(guest, propertyId, session);
      }
      break; // Exit loop if successful
    } catch (error) {
      attempt++;
      logger.error(`Attempt ${attempt} failed: ${error.message}`);
    }
  }
  return result;
};

/**
 * Find guest by guest status
 * @param {string} propertyId - property id
 * @param {object} filter - filter object
 * @param {string} status - guest status to filter by
 * @returns {Promise<import('../models/guest.model').GuestType>} guest - guest object
 */
const findGuestByGuestStatus = async (propertyId, filter, status) => {
  const pipeline = [
    {
      $match: {
        propertyId: new mongoose.Types.ObjectId(propertyId),
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
        "status.currentStatus": status,
      },
    },
    {
      $project: filter,
    },
  ];
  const guest = await Guest.aggregate(pipeline);
  return guest[0];
};

module.exports = {
  create,
  getAll,
  getById,
  update,
  remove,
  getAllGuestsWithStatus,
  getByGuestId,
  getPhoneNumbers,
  find,
  findWithStatus,
  getGuestAddonsRequests,
  createDndRequest,
  updatedGuestDndStatus,
  getGuestDndStatus,
  getByPropertyIdAndGuestId,
  getGuestByPhoneNumber,
  getGuestAddonsRequestsv2,
  getByGuestPmsId,
  upsert,
  updateByPmsId,
  upsertWithRetry,
  findGuestByGuestStatus,
};
