const guestService = require("../services/guest.service");
const messageService = require("../services/message.service");
module.exports = (io, socket) => {
  const sendsms = async (payload) => {
    const message = payload;
    const result = MessageValidationSchema.safeParse(message);
    if (!result.success) {
      io.emit("message_error", { error: result.error.flatten().fieldErrors });
    }
    const guest = await guestService.getById(
      message.guestId,
      message.propertyId
    );
    const property = await propertyService.getById(message.propertyId);
    const sentMessage = await client.messages.create({
      body: result.data.content,
      from: property.countryCode + property.phoneNumber,
      to: guest.countryCode + guest.phoneNumber,
    });
    const newMessage = await messageService.create({
      ...result.data,
      propertyId: message.propertyId,
      guestId: message.guestId,
      senderId: message.propertyId,
      receiverId: message.guestId,
    });

    io.emit("message:sent", newMessage);
  };

  const getAllMessages = async (payload) => {
    const { propertyId } = socket.handshake.query;
    const messages = await messageService.getAll(propertyId, payload.guestId);
    io.emit("message:getAll", messages);
  };

  socket.on("message:send", sendsms);
  socket.on("message:getAll", getAllMessages);
};
