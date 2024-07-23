const {default: mongoose} = require("mongoose");
const guestStatusService = require("../services/guestStatus.service");

const {GuestStatusValidationSchema} = require("../models/guestStatus.model");

const create = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const {propertyId, guestId} = req.params;
        const guestStatus = req.body;
        const result = GuestStatusValidationSchema.safeParse({
            guestId,
            propertyId,
            ...guestStatus,
        });
        if (!result.success) {
            return res
                .status(400)
                .json({error: result.error.flatten().fieldErrors});
        }
        const savedGuestStatus = await guestStatusService.create(
            propertyId,
            guestId,
            guestStatus,
            session,
        );
        await session.commitTransaction();
        await session.endSession();
        return res.status(200).json({result: {guestStatus: savedGuestStatus}});
    } catch (e) {
        await session.abortTransaction();
        await session.endSession();
        return res
            .status(500)
            .json({error: {server: "Internal Server Error" + e}});
    }
};

module.exports = {create};
