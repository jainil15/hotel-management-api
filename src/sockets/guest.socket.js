const { io } = require("socket.io");

const guestService = require("../services/guest.service");
const guestStatusService = require("../services/guestStatus.service");
const {
  checkPropertyAccessSocket,
} = require("../middlewares/propertyaccess.middleware");

module.exports = (io, socket) => {
  const createGuest = (payload) => {
    try {
      const { propertyId } = socket.handshake.query;
      const guest = payload;
      const newGuest = guestService.create(guest, propertyId);
      io.emit(`guest:create`, newGuest);
    } catch (e) {
      io.emit("error", { error: { server: "Internal server error" + e } });
    }
  };
  const get = async (payload) => {
    try {
      const { propertyId } = socket.handshake.query;
      const { guestId } = payload;

      const guest = await guestService.getById(guestId, propertyId);

      io.emit(`guest:${propertyId}:get:${guestId}`, guest);
    } catch (e) {
      io.emit("error", { error: { server: "Internal server error" } });
    }
  };
  const getAllGuests = async (payload) => {
    try {
      const { propertyId } = socket.handshake.query;

      const guests = await guestStatusService.getAllGuestWithStatusv2(propertyId, {}, );

      io.emit(`guest:getAll`, guests);
    } catch (e) {
      io.emit("error", { error: { server: "Internal server error" } });
    }
  };

  socket.on("guest:create", createGuest);
  // socket.on("guest:read", readGuest);
  socket.on("guest:getAll", getAllGuests);
};
