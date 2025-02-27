const { HouseKeepingRequest } = require("../models/houseKeepingRequest.model");
const create = async (propertyId, guestId, session) => {
  const newHouseKeepingRequest = await HouseKeepingRequest.(
    { propertyId, guestId },
    session,
  );
  return newHouseKeepingRequest;
};
