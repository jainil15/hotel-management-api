const { responseHandler } = require("../middlewares/response.middleware");
const propertyTokenService = require("../services/propertyToken.service");

const getByPropertyId = async (req, res) => {
    const propertyId = req.params.propertyId;
    try {
        const propertyToken = await propertyTokenService.getByPropertyId(propertyId);
        console.log(propertyToken);
        return responseHandler(res, propertyToken, 200, "Property token fetched successfully");
    } catch (error) {
        console.log(error);
        return responseHandler(res, null, 500, error.message);
    }
}

module.exports = {
    getByPropertyId
}