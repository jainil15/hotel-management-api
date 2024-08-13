const { default: mongoose } = require("mongoose");
const messageService = require("./message.service");
const {
  GUEST_CURRENT_STATUS,
  GUEST_REQUEST,
} = require("../constants/guestStatus.contant");
const { GuestStatus } = require("../models/guestStatus.model");
const {
  validateUpdate,
  validateStatusForGuest,
} = require("../utils/guestStatus.util");
const {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} = require("../lib/CustomErrors");
const { Guest } = require("../models/guest.model");
const {
  dateValidation,
  zodCustomDateValidation,
} = require("../utils/dateCompare");

/**
 * Create a new guest status
 * @param {string} propertyId - The property id
 * @param {string} guestId - The guest id
 * @param {object} status - The status object
 * @param {object} session - The mongoose session
 * @returns {Promise<GuestStatus>} - The saved guest status
 */
const create = async (propertyId, guestId, status, session) => {
  try {
    const newGuestStatus = new GuestStatus({
      guestId: guestId,
      propertyId: propertyId,
      ...status,
    });

    const savedGuestStatus = await newGuestStatus.save({ session });
    return savedGuestStatus;
  } catch (e) {
    throw new Error(e.message);
  }
};

/**
 * Get guest status by guestId
 * @param {string} guestId - The guestId to filter guest status
 * @returns {Promise<GuestStatus>} - The guest status
 */
const getByGuestId = async (guestId) => {
  const guestStatus = await GuestStatus.findOne({ guestId: guestId });
  return guestStatus;
};

/**
 * Get guest status by propertyId
 * @param {string} propertyId - The propertyId to filter guest status
 * @returns {Promise<GuestStatus>} - The guest status
 */
const getByPropertyId = async (propertyId) => {
  const guestStatus = await GuestStatus.find({ propertyId: propertyId });
  return guestStatus;
};

/**
 * Get all guest with status
 * @param {string} propertyId - The propertyId to filter guest status
 * @returns {Promise<Guest[]>} - The list of guests with status
 */
const getAllGuestWithStatus = async (propertyId) => {
  const guest = await GuestStatus.find({ propertyId: propertyId }).populate(
    "guestId",
  );
  return guest.map((guest) => {
    return {
      ...guest.guestId,
      status: guest.status,
    };
  });
};

/**
 * Get all guest with status
 * @param {string} propertyId - The propertyId to filter guest status
 * @param {object} filters - The filters
 * @returns {Promise<Guest[]>} - The list of guests with status
 */
const getAllGuestWithStatusv2 = async (propertyId, filters) => {
  const guestPipeline = [];
  guestPipeline.push({
    $match: {
      propertyId: new mongoose.Types.ObjectId(propertyId),
    },
  });
  if (filters.checkIn) {
    guestPipeline.push(
      {
        $addFields: {
          checkInParts: {
            $dateToParts: {
              date: "$checkIn",
            },
          },
          filterCheckInParts: {
            $dateToParts: {
              date: new Date(filters.checkIn),
            },
          },
        },
      },
      {
        $match: {
          $expr: {
            $and: [
              { $eq: ["$checkInParts.year", "$filterCheckInParts.year"] },
              { $eq: ["$checkInParts.month", "$filterCheckInParts.month"] },
              { $eq: ["$checkInParts.day", "$filterCheckInParts.day"] },
            ],
          },
        },
      },
    );
  }
  if (filters.checkOut) {
    guestPipeline.push(
      {
        $addFields: {
          checkOutParts: {
            $dateToParts: {
              date: "$checkOut",
            },
          },
          filterCheckOutParts: {
            $dateToParts: {
              date: new Date(filters.checkOut),
            },
          },
        },
      },
      {
        $match: {
          $expr: {
            $and: [
              { $eq: ["$checkOutParts.year", "$filterCheckOutParts.year"] },
              { $eq: ["$checkOutParts.month", "$filterCheckOutParts.month"] },
              { $eq: ["$checkOutParts.day", "$filterCheckOutParts.day"] },
            ],
          },
        },
      },
    );
  }

  guestPipeline.push(
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
  );

  if (filters.currentStatus) {
    guestPipeline.push({
      $match: {
        "status.currentStatus": {
          $eq: filters.currentStatus,
        },
      },
    });
  }
  if (filters.search) {
    guestPipeline.push(
      {
        $addFields: {
          fullName: {
            $concat: ["$firstName", "", "$lastName"],
          },
          reverseFullName: {
            $concat: ["$lastName", "", "$firstName"],
          },
        },
      },
      {
        $addFields: Object.keys(Guest.schema.obj).reduce((acc, key) => {
          acc[`string_${key}`] = {
            $cond: {
              if: { $in: [{ $type: `$${key}` }, ["date", "objectId"]] },
              // biome-ignore lint/suspicious/noThenProperty: <explanation>
              then: {
                $dateToString: { format: "%d:%m:%YT%H:%M", date: `$${key}` },
              },
              else: { $toString: `$${key}` },
            },
          };
          return acc;
        }, {}),
      },
      {
        $match: {
          $or: Object.keys(Guest.schema.obj).map((key) => ({
            [`string_${key}`]: {
              $regex: new RegExp(
                filters.search.replace(/[#-.]|[[-^]|[?|{}]/g, "\\$&"),
              ),

              $options: "i",
            },
          })),
        },
      },
    );
  }
  guestPipeline.push({
    $project: {
      _id: 1,
      propertyId: 1,
      countryCode: 1,
      phoneNumber: 1,
      source: 1,
      checkIn: 1,
      checkOut: 1,
      confirmationNumber: 1,
      roomNumber: 1,
      firstName: 1,
      lastName: 1,
      email: 1,
      active: 1,
      status: {
        currentStatus: 1,
        lateCheckOutStatus: 1,
        earlyCheckInStatus: 1,
        reservationStatus: 1,
        preArrivalStatus: 1,
      },
    },
  });

  const guests = await Guest.aggregate(guestPipeline);
  return guests;
};

/**
 * Update guest status
 * @param {string} guestId - The guest id
 * @param {object} guestStatus - The guest status object
 * @param {object} session - The mongoose session
 * @param {string} role - The role of the user
 * @returns {Promise<GuestStatus>} - The updated guest status
 */
const update = async (guestId, guestStatus, session, role = "admin") => {
  const oldGuestStatus = await GuestStatus.findOne({ guestId });
  const updatedGuestStatus = await GuestStatus.findOneAndUpdate(
    { guestId: guestId },
    guestStatus,
    {
      new: true,
      session: session,
    },
  );
  if (!updatedGuestStatus) {
    throw new NotFoundError("Guest not found", {
      guestId: ["Guest not found"],
    });
  }
  if (!validateUpdate(oldGuestStatus._doc, updatedGuestStatus._doc)) {
    throw new ValidationError("Invalid Status", {
      currentStatus: ["Invalid Status"],
    });
  }

  if (
    role === "guest" &&
    !validateStatusForGuest(oldGuestStatus._doc, updatedGuestStatus._doc)
  ) {
    throw new ForbiddenError("Forbidden to update status", {
      guestId: ["Guest is not allowed to update status"],
    });
  }

  return updatedGuestStatus;
};

const remove = async (guestId, session) => {
  const guestStatus = await GuestStatus.findOneAndDelete(
    { guestId },
    { session: session },
  );
  if (!guestStatus) {
    throw new NotFoundError("Guest not found", {
      guestId: ["Guest not found"],
    });
  }
  return guestStatus;
};

module.exports = {
  create,
  remove,
  getByGuestId,
  getByPropertyId,
  update,
  getAllGuestWithStatus,
  getAllGuestWithStatusv2,
};
