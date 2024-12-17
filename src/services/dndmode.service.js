const { DoNotDisturbRequest } = require("../models/doNotDisturb.model");

const update = async (propertyId, guestId, dndModeRequest, session) => {
  const updatedAddOnsRequest = await DoNotDisturbRequest.findOneAndUpdate(
    { propertyId, guestId },
    dndModeRequest,
    {
      new: true,
      session,
      sort: { _id: -1 },
    },
  );

  return updatedAddOnsRequest;
};

const getById = async (propertyId, guestId, dndModeRequestId) => {
  const dndModeRequest = await DoNotDisturbRequest.findOne({
    propertyId,
    guestId,
    requestStatus: "Accepted",
  })
    .sort({
      updatedAt: -1,
    })
    .limit(1);
  return dndModeRequest;
};

const getByPropertyIdAndGuestId = async (propertyId, guestId) => {
  const doNotDisturbRequest = await DoNotDisturbRequest.find({
    propertyId: propertyId,
    guestId: guestId,
  })
    .populate({ path: "guestId" })
    .sort({ updatedAt: -1 });
  return doNotDisturbRequest;
};

module.exports = {
  update,
  getById,
  getByPropertyIdAndGuestId,
};
