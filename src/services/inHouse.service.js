const create = async (propertyId, inHouse, session) => {
  const newInHouse = new InHouse({ ...inHouse, propertyId });
  const savedInHouse = await newInHouse.save({ session });
  return savedInHouse;
};
