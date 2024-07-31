const { default: mongoose } = require("mongoose");
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
} = require("../lib/CustomErrors");
const { Guest } = require("../models/guest.model");
const {
  dateValidation,
  zodCustomDateValidation,
} = require("../utils/dateCompare");

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
    throw new Error("Error while creating guest status");
  }
};

const getByGuestId = async (guestId) => {
  const guestStatus = await GuestStatus.findOne({ guestId: guestId });
  return guestStatus;
};

const getByPropertyId = async (propertyId) => {
  const guestStatus = await GuestStatus.find({ propertyId: propertyId });
  return guestStatus;
};

const getAllGuestWithStatus = async (propertyId) => {
  const guest = await GuestStatus.find({ propertyId: propertyId }).populate(
    "guestId"
  );
  return guest.map((guest) => {
    return {
      ...guest.guestId,
      status: guest.status,
    };
  });
};

const getAllGuestWithStatusv2 = async (propertyId, filters) => {
  const guestPipeline = [];

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
      }
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
      }
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
    }
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
  if (filters.name) {
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
        $match: {
          $expr: {
            $or: [
              {
                $regexMatch: {
                  input: "$fullName",
                  regex: filters.name,
                  options: "ix",
                },
              },
              {
                $regexMatch: {
                  input: "$lastName",
                  regex: filters.name,
                  options: "ix",
                },
              },
              {
                $regexMatch: {
                  input: "$firstName",
                  regex: filters.name,
                  options: "ix",
                },
              },
              {
                $regexMatch: {
                  input: "$reverseFullName",
                  regex: filters.name,
                  options: "ix",
                },
              },
            ],
          },
        },
      }
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

const update = async (guestId, guestStatus, session, role = "admin") => {
  const oldGuestStatus = await GuestStatus.findOne({ guestId });
  const updatedGuestStatus = await GuestStatus.findOneAndUpdate(
    { guestId: guestId },
    guestStatus,
    {
      new: true,
      session: session,
    }
  );
  if (!updatedGuestStatus) {
    throw new NotFoundError("Guest not found", {
      guestId: ["Guest not found"],
    });
  }
  if (!validateUpdate(oldGuestStatus, updatedGuestStatus)) {
    throw new ValidationError("Invalid Status", {
      currentStatus: ["Invalid Status"],
    });
  }

  if (
    role === "guest" &&
    !validateStatusForGuest(oldGuestStatus, updatedGuestStatus)
  ) {
    throw new UnauthorizedError("Unauthorized to update status", {
      guestId: ["Guest is not allowed to update status"],
    });
  }

  return updatedGuestStatus;
};

module.exports = {
  create,
  getByGuestId,
  getByPropertyId,
  update,
  getAllGuestWithStatus,
  getAllGuestWithStatusv2,
};
