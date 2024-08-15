const { AddOnsFlow } = require("../models/addOnsFlow.model");

const getByPropertyId = async (propertyId) => {
  const addOnsFlow = await AddOnsFlow.findOne({
    propertyId,
  });
  return addOnsFlow;
};

const create = async (propertyId, addOnsFlow, session) => {
  const newAddOnsFlow = new AddOnsFlow({
    propertyId,
    ...addOnsFlow,
  });
  await newAddOnsFlow.save({
    session,
  });
  return newAddOnsFlow;
};

const update = async (propertyId, addOnsFlow, session) => {
  const updatedAddOnsFlow = await AddOnsFlow.findOneAndUpdate(
    {
      propertyId,
    },
    {
      ...addOnsFlow,
    },
    {
      new: true,
      session,
    },
  );
  return updatedAddOnsFlow;
};

const remove = async (propertyId, session) => {
  await AddOnsFlow.deleteOne(
    {
      propertyId,
    },
    { session },
  );
};

module.exports = {
  getByPropertyId,
  create,
  remove,
  update,
};
