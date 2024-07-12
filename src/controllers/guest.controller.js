const { GuestValidationScehma } = require("../models/guest.model");
const guestService = require("../services/guest.service");
const guestStatusService = require("../services/guestStatus.service");
const getAll = async (req, res) => {
  try {
    const guests = await guestService.getAll(req.params.propertyId);
    return res.status(200).json({ result: { guests: guests } });
  } catch (e) {
    return res.status(500).json({ error: { server: "Internal server error" } });
  }
};

const create = async (req, res) => {
  try {
    const { currentStatus, ...guest } = req.body;

    const propertyId = req.params.propertyId;
    const result = GuestValidationScehma.safeParse(guest);
    if (!result.success) {
      return res
        .status(400)
        .json({ error: result.error.flatten().fieldErrors });
    }
    const newGuest = await guestService.create(guest, propertyId);
    const newGuestStatus = await guestStatusService.create(
      propertyId,
      newGuest._id,
      currentStatus
    );
    if (!newGuest || !newGuestStatus) {
      return res.status(400).json({ error: { guest: "Error creating guest" } });
    }
    return res
      .status(200)
      .json({ result: { guest: newGuest, guestStatus: newGuestStatus } });
  } catch (e) {
    return res
      .status(500)
      .json({ error: { server: "Internal server error" + e } });
  }
};

const getById = async (req, res) => {
  try {
    const guestId = req.params.guestId;
    const propertyId = req.params.propertyId;
    const guest = await guestService.getById(guestId, propertyId);
    return res.status(200).json({ result: { guest: guest } });
  } catch (e) {
    return res.status(500).json({ error: { server: "Internal server error" } });
  }
};

const update = async (req, res) => {
  try {
    const guest = req.body;
    const propertyId = req.params.propertyId;
    const guestId = req.params.guestId;
    const result = GuestValidationScehma.safeParse(guest);
    if (!result.success) {
      return res
        .status(400)
        .json({ error: result.error.flatten().fieldErrors });
    }
    const updatedGuest = await guestService.update(guest, propertyId, guestId);
    return res.status(200).json({ result: { guest: updatedGuest } });
  } catch (e) {
    return res.status(500).json({ error: { server: "Internal server error" } });
  }
};

const remove = async (req, res) => {
  try {
    const guestId = req.params.guestId;
    const propertyId = req.params.propertyId;
    const removedGuest = await guestService.remove(guestId, propertyId);
    return res.status(200).json({ result: { guest: removedGuest } });
  } catch (e) {
    return res.status(500).json({ error: { server: "Internal server error" } });
  }
};

module.exports = { getAll, create, getById, update, remove };
