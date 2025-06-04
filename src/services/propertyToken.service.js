const {PropertyToken} = require("../models/propertyToken.model");

const getByPropertyId = async (propertyId) => {
    const propertyToken = await PropertyToken.find({propertyId: propertyId});
    if (!propertyToken) {
        throw new APIError("Property token not found", 404);
    }
    return propertyToken;
}

module.exports = {
    getByPropertyId
}

