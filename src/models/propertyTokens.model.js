const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const logger = require("../configs/winston.config");

const propertyTokenSchema = new Schema({
    propertyId: {
        type: Schema.Types.ObjectId,
        ref: "Property",
        required: true,
    },
    accessToken: {
        type: String,
        required: true,
    },
    refreshToken: {
        type: String,
        required: true,
    },
    expiresIn: {
        type: Number,
        required: true,
    },
}, {timestamps: true});

const PropertyToken = mongoose.model("PropertyToken", propertyTokenSchema);

PropertyToken.init().then(() => {
    logger.info("Initialized PropertyToken Model");
});

module.exports = {
    PropertyToken,
};


