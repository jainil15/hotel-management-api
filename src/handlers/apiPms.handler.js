const {
  GUEST_CURRENT_STATUS,
  RESERVATION_STATUS,
} = require("../constants/guestStatus.contant");

const guestService = require("../services/guest.service");
const guestStatusService = require("../services/guestStatus.service");
const guestSessionService = require("../services/guestSession.service");
const chatListService = require("../services/chatList.service");
const messageService = require("../services/message.service");
const propertyService = require("../services/property.service");

/**
 * @description Create a new booking
 * @param {import('express').Request} req - Request
 * @param {import('express').Response} res - Response
 * @param {import('express').NextFunction} next - Next function
 * @returns {Promise<import('express').Response>}
 * @throws {Error} - Error
 */
const bookingCreate = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const folio = req.body.Folios[0];
    const {
      FolioInformation,
      BuissnessSource,
      GroupInformation,
      GuestInformation,
      StayInformation,
    } = folio;
    const propertyId = req.params.propertyId;
    const pmsId = req.body.ClientInformation.ClientId;
    const guestData = {
      propertyId: propertyId,
      pmsId: pmsId,

      firstName: GuestInformation.FirstName,
      lastName: GuestInformation.LastName,
      email: GuestInformation.Email,
      source: BuissnessSource.Source,
      checkIn: StayInformation.CheckInDate,
      checkOut: StayInformation.CheckOutDate,
      roomNumber: StayInformation.Room,
      confirmationNumber: FolioInformation.CRSFolioNumber,
      // TODO: country code and phonenumber test
      //
      phoneNumber: GuestInformation.Phone.split("-").join(""),
      countryCode: GuestInformation.CountryCode,
      draft: true,
    };
    const guestStatusData = {
      currentStatus: GUEST_CURRENT_STATUS.RESERVED,
      reservationStatus: RESERVATION_STATUS.CONFIRMED,
    };
    // const existingInHouseGuest = await guestService.findWithStatus(
    //   {
    //     phoneNumber: guestData.phoneNumber,
    //     countryCode: guestData.countryCode,
    //     propertyId: guestData.propertyId,
    //   },
    //   {
    //     currentStatus: GUEST_CURRENT_STATUS.IN_HOUSE,
    //     reservationStatus: RESERVATION_STATUS.CONFIRMED,
    //   },
    // );
    // console.log("Exisint guest  inhouse confirmed", existingInHouseGuest);
    // if (existingInHouseGuest.length > 0) {
    //   throw new ValidationError("Guest already exists with this phone number", {
    //     phoneNumber: ["Guest already exists with this phone number"],
    //   });
    // }
    // const existingReservedGuest = await guestService.findWithStatus(
    //   {
    //     phoneNumber: guestData.phoneNumber,
    //     countryCode: guestData.countryCode,
    //     propertyId: guestData.propertyId,
    //   },
    //   {
    //     currentStatus: GUEST_CURRENT_STATUS.RESERVED,
    //     reservationStatus: RESERVATION_STATUS.CONFIRMED,
    //   },
    // );
    // console.log("Exisint guest  reservation confirmed", existingInHouseGuest);
    // if (existingReservedGuest.length > 0) {
    //   throw new ValidationError("Guest already exists with this phone number", {
    //     phoneNumber: ["Guest already exists with this phone number"],
    //   });
    // }

    // Create guest
    const newGuest = await guestService.create(guest, propertyId, session);

    // Create guest status
    const newGuestStatus = await guestStatusService.create(
      propertyId,
      newGuest._id,
      guestStatusData,
      session,
    );

    await session.commitTransaction();
    session.endSession();

    // Emit to guest list updated
    req.app.io.to(`property:${propertyId}`).emit("guest:guestUpdate", {
      guest: { ...newGuest._doc, status: { ...newGuestStatus._doc } },
    });
    return responseHandler(
      res,
      { guest: { ...newGuest._doc, status: { ...newGuestStatus._doc } } },
      201,
      "Guest Created",
    );
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

/**
 * @description Create a new booking
 * @param {import('express').Request} req - Request
 * @param {import('express').Response} res - Response
 * @param {import('express').NextFunction} next - Next function
 * @returns {Promise<import('express').Response>}
 * @throws {Error} - Error
 */
const bookingUpdate = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const folio = req.body.Folios[0];
    const {
      FolioInformation,
      BuissnessSource,
      GroupInformation,
      GuestInformation,
      StayInformation,
    } = folio;
    const propertyId = req.params.propertyId;
    const pmsId = req.body.ClientInformation.ClientId;
    const guestData = {
      propertyId: propertyId,
      pmsId: pmsId,

      firstName: GuestInformation.FirstName,
      lastName: GuestInformation.LastName,
      email: GuestInformation.Email,
      source: BuissnessSource.Source,
      checkIn: StayInformation.CheckInDate,
      checkOut: StayInformation.CheckOutDate,
      roomNumber: StayInformation.Room,
      confirmationNumber: FolioInformation.CRSFolioNumber,
      // TODO: country code and phonenumber test
      //
      phoneNumber: GuestInformation.Phone.split("-").join(""),
      countryCode: GuestInformation.CountryCode,
    };

    const guestStatusData = {
      currentStatus: GUEST_CURRENT_STATUS.RESERVED,
      reservationStatus: RESERVATION_STATUS.CONFIRMED,
    };
    const guest = await guestService.findByPmsId(propertyId, pmsId);

    // Update guest
    const updatedGuest = await guestService.update(
      guestData,
      propertyId,
      guest._id,
      session,
    );

    // Update guest status
    const updatedGuestStatus = await guestStatusService.update(
      propertyId,
      updatedGuest._id,
      guestStatusData,
      session,
    );

    await session.commitTransaction();
    session.endSession();

    // Emit to guest list updated
    req.app.io.to(`property:${propertyId}`).emit("guest:guestUpdate", {
      guest: { ...updatedGuest._doc, status: { ...updatedGuestStatus._doc } },
    });
    return responseHandler(
      res,
      { guest: { ...updatedGuest._doc, status: { ...updatedGuest._doc } } },
      201,
      "Guest Created",
    );
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

const bookingNoShowCancel = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const folio = req.body.Folios[0];
    const {
      FolioInformation,
      BuissnessSource,
      GroupInformation,
      GuestInformation,
      StayInformation,
    } = folio;
    const pmsId = req.body.ClientInformation.ClientId;
    const guest = await guestService.findByPmsId(propertyId, pmsId);
    if (!guest) {
      throw new NotFoundError("Guest not found", {
        guestId: ["Guest not found for the given id"],
      });
    }
    const guestStatus = await guestStatusService.findByGuestId(
      propertyId,
      guest._id,
    );
    if (!guestStatus) {
      throw new NotFoundError("Guest status not found", {
        guestId: ["Guest status not found for the given id"],
      });
    }
    const guestStatusData = {
      reservationStatus: RESERVATION_STATUS.CANCELLED,
    };
    const updatedGuestStatus = await guestStatusService.update(
      propertyId,
      guest._id,
      guestStatusData,
      session,
    );

    // Emit to guest list updated
    await session.commitTransaction();
    session.endSession();

    // Emit to guest list updated
    req.app.io.to(`property:${propertyId}`).emit("guest:guestUpdate", {
      guest: { ...guest._doc, status: { ...updatedGuestStatus._doc } },
    });
    return responseHandler(
      res,
      { guest: { ...guest._doc, status: { ...updatedGuestStatus._doc } } },
      201,
      "Guest Created",
    );
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

/**
 * @param {import('express').Request} req - Request
 * @param {import('express').Response} res - Response
 * @param {import('express').Next} next - Next
 * @returns {Promise<import('express').Response>}
 * @throws {Error} - Error
 */
const reservationCreate = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const folio = req.body.Folios[0];
    const {
      FolioInformation,
      BuissnessSource,
      GroupInformation,
      GuestInformation,
      StayInformation,
    } = folio;
    const propertyId = req.params.propertyId;
    const pmsId = req.body.ClientInformation.ClientId;
    const guestData = {
      propertyId: propertyId,
      pmsId: pmsId,

      firstName: GuestInformation.FirstName,
      lastName: GuestInformation.LastName,
      email: GuestInformation.Email,
      source: BuissnessSource.Source,
      checkIn: StayInformation.CheckInDate,
      checkOut: StayInformation.CheckOutDate,
      roomNumber: StayInformation.Room,
      confirmationNumber: FolioInformation.CRSFolioNumber,
      // TODO: country code and phonenumber test
      //
      phoneNumber: GuestInformation.Phone.split("-").join(""),
      countryCode: GuestInformation.CountryCode,
      draft: false,
    };
    const guestStatusData = {
      currentStatus: GUEST_CURRENT_STATUS.RESERVED,
      reservationStatus: RESERVATION_STATUS.CONFIRMED,
    };
    // Upsert guest
    const upsertedGuest = await guestService.upsert(
      guestData,
      propertyId,
      session,
    );

    // Upsert guest status
    const upsertedGuestStatus = await guestStatusService.upsert(
      propertyId,
      upsertedGuest._id,
      guestStatusData,
      session,
    );
    // Create Guest Session
    const guestSession = await guestSessionService.create(
      propertyId,
      upsertedGuest._id,
      session,
    );
    // Create chat list
    const chatList = await chatListService.create(
      propertyId,
      upsertedGuest._id,
      session,
    );

    // todo: move to sms.service
    // Send message to the guest
    const { property } = await propertyService.getById(propertyId);
    // const message = `Welcome to ${property.name}.\nYour guest portal link is: ${process.env.MOBILE_FRONTEND_URL}/${guestSession._id}`;
    // await twilioService.sendAccessLink(
    //   propertyId,
    //   `${upsertedGuest.countryCode + upsertedGuest.phoneNumber}`,
    //   message,
    // );
    // TODO: Workflow message trigger
    // if (sendMessage === true) {
    // }
    //await session.commitTransaction();
    //session.startTransaction();

    // Send message to the guest according to the status
    if (sendMessage === true && guest.phoneNumber && guest.countryCode) {
      const messageTemplate =
        await messageTemplateService.getByNameAndPropertyId(
          propertyId,
          guestStatusToTemplateOnCreate(upsertedGuestStatus),
        );
      if (messageTemplate) {
        const twilioAccount =
          await twilioAccountService.getByPropertyId(propertyId);
        const twilioSubClient =
          await twilioService.getTwilioClient(twilioAccount);
        const propertySetting = await settingService.getByPropertyId(
          property._id,
        );
        const updatedMessageBody = modifyMessageTemplateBody(
          messageTemplate,
          upsertedGuest,
          property,
          propertySetting,
          `${process.env.MOBILE_FRONTEND_URL}/${guestSession._id}`,
        );
        const sentMessage = await smsService.send(
          twilioSubClient,
          `${twilioAccount.countryCode}${twilioAccount.phoneNumber}`,
          `${upsertedGuest.countryCode}${upsertedGuest.phoneNumber}`,
          `${updatedMessageBody.message}`,
        );
        const newMessage = await messageService.create(
          {
            propertyId: propertyId,
            guestId: upsertedGuest._id,
            senderId: propertyId,
            receiverId: upsertedGuest._id,
            content: sentMessage.body,
            messageSid: sentMessage.sid,
            messageType: messageType.SMS,
            messageTriggerType: messageTriggerType.AUTOMATIC,
            status: sentMessage.status,
          },
          session,
        );
        const updatedChatList =
          await chatListService.updateAndIncUnreadMessages(
            propertyId,
            upsertedGuest._id,
            {
              latestMessage: newMessage._id,
            },
            session,
            0,
          );
      }
    }

    await session.commitTransaction();
    session.endSession();

    // Emit to guest list updated
    req.app.io.to(`property:${propertyId}`).emit("guest:guestUpdate", {
      guest: { ...upsertedGuest._doc, status: { ...upsertedGuestStatus._doc } },
    });
    // Emit to chat list updated
    req.app.io.to(`property:${propertyId}`).emit("chatList:update", {
      chatList: chatList,
    });
    // Emit to guest messages updated
    req.app.io.to(`guest:${upsertedGuest._id}`).emit("message:newMessage", {
      message: {},
    });
    return responseHandler(
      res,
      {
        guest: {
          ...upsertedGuest._doc,
          status: { ...upsertedGuestStatus._doc },
        },
      },
      201,
      "Guest Created",
    );
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

/**
 * Update reservation
 * @param {import('express').Request} req - Request
 * @param {import('express').Response} res - Response
 * @param {import('express').NextFunction} next - Next function
 * @returns {Promise<import('express').Response>}
 */
const reservationUpdate = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // TODO: add messageGuest
    const { sendMessage, status, ...guest } = req.body;
    const propertyId = req.params.propertyId;
    const guestId = req.params.guestId;
    const guestResult = await UpdateGuestValidationSchema.safeParseAsync(guest);
    const statusResult =
      await UpdateGuestStatusValidationSchema.safeParseAsync(status);
    const roomNumberResult =
      status.currentStatus === GUEST_CURRENT_STATUS.RESERVED
        ? z.string().optional().safeParse(status.roomNumber)
        : z
            .string()
            .optional()
            .superRefine((args, ctx) => {
              if (guest.roomNumber === undefined) {
                ctx.addIssue({
                  path: ["roomNumber"],
                  code: "invalid_room_number",
                  message: "Room number is required",
                });
              }
            })
            .safeParse(status.roomNumber);
    if (
      !guestResult.success ||
      !statusResult.success ||
      !roomNumberResult.success
    ) {
      throw new ValidationError("Validation Error", {
        ...guestResult?.error?.flatten().fieldErrors,
        ...statusResult?.error?.flatten().fieldErrors,
        ...roomNumberResult?.error?.flatten().fieldErrors,
      });
    }
    let checkCheckInUpdated = false;
    let checkCheckOutUpdated = false;
    const guestInfo = await guestService.getById(guestId, propertyId);
    const updatedGuest = await guestService.update(
      guest,
      propertyId,
      guestId,
      session,
    );
    if (
      new Date(guestInfo.checkIn).getTime() !==
      new Date(updatedGuest.checkIn).getTime()
    ) {
      checkCheckInUpdated = true;
    }

    if (
      new Date(guestInfo.checkOut).getTime() !==
      new Date(updatedGuest.checkOut).getTime()
    ) {
      checkCheckOutUpdated = true;
    }
    const oldGuestStatus = await guestStatusService.getByGuestId(guestId);
    const updatedGuestStatus = await guestStatusService.update(
      guestId,
      status,
      session,
    );
    if (
      req.body?.status?.currentStatus !== "Reservation" &&
      !req.body?.phoneNumber
    ) {
      throw new ValidationError("Phone number is required", {
        phoneNumber: ["Phone number is required"],
      });
    }
    // Check for early check in or late check out
    const existingCheckInOutRequests =
      await checkInOutRequestService.getByPropertyIdAndGuestId(
        propertyId,
        guestId,
      );
    for (const existingCheckInOutRequest of existingCheckInOutRequests) {
      if (
        updatedGuestStatus[`${existingCheckInOutRequest.requestType}Status`] !==
        oldGuestStatus[`${existingCheckInOutRequest.requestType}Status`]
      ) {
        if (
          existingCheckInOutRequest.requestStatus === REQUEST_STATUS.REQUESTED
        ) {
          if (
            updatedGuestStatus[
              `${existingCheckInOutRequest.requestType}Status`
            ] === REQUEST_STATUS.ACCEPTED
          ) {
            if (
              compareDate(
                existingCheckInOutRequest[
                  `${existingCheckInOutRequest.requestType}DateTime`
                ],
                updatedGuest[
                  `${existingCheckInOutRequest.requestType
                    .match(/[A-Z][a-z]+/g)
                    .join("")
                    .replace("C", "c")}`
                ],
              )
            ) {
              await checkInOutRequestService.updateRequestStatus(
                propertyId,
                existingCheckInOutRequest._id,
                {
                  requestStatus: REQUEST_STATUS.ACCEPTED,
                },
                session,
              );
            } else {
              console.log(
                existingCheckInOutRequest[
                  `${existingCheckInOutRequest.requestType}DateTime`
                ],
                existingCheckInOutRequest.requestType
                  .match(/[A-Z][a-z]+/g)
                  .join("")
                  .replace("C", "c"),
                updatedGuest[
                  `${existingCheckInOutRequest.requestType
                    .match(/[A-Z][a-z]+/g)
                    .join("")
                    .replace("C", "c")}`
                ],
              );
              throw new ValidationError(
                `${existingCheckInOutRequest.requestType.match(/[A-Z][a-z]+/g).join(" ")} requested for ${existingCheckInOutRequest[
                  existingCheckInOutRequest.requestType + "DateTime"
                ].toISOString()}`,
                {
                  [`${existingCheckInOutRequest.requestType}DateTime`]: [
                    "Requested date time mismatch",
                  ],
                },
              );
            }
          } else if (
            updatedGuestStatus[
              `${existingCheckInOutRequest.requestType}Status`
            ] === REQUEST_STATUS.DECLINED
          ) {
            await checkInOutRequestService.updateRequestStatus(
              propertyId,
              existingCheckInOutRequest._id,
              {
                requestStatus: REQUEST_STATUS.DECLINED,
              },
              session,
            );
          }
        }
      }
    }
    // Send message to the guest according to the status
    if (sendMessage === true && guest.phoneNumber && guest.countryCode) {
      const { property } = await propertyService.getById(propertyId);
      if (checkCheckInUpdated || checkCheckOutUpdated) {
        const guestSession = await guestSessionService.getGuestSession(
          propertyId,
          guestId,
        );
        const messageTemplate =
          await messageTemplateService.getByNameAndPropertyId(
            propertyId,
            guestTimingUpdate(guestInfo, updatedGuest),
          );

        const twilioAccount =
          await twilioAccountService.getByPropertyId(propertyId);
        if (!twilioAccount) {
          throw new NotFoundError("Twilio account not found", {
            propertyId: ["Twilio account not found for this property"],
          });
        }

        const twilioSubClient =
          await twilioService.getTwilioClient(twilioAccount);
        const propertySetting = await settingService.getByPropertyId(
          property._id,
        );
        const updatedMessageBody = modifyMessageTemplateBody(
          messageTemplate,
          updatedGuest,
          property,
          propertySetting,
          `${process.env.MOBILE_FRONTEND_URL}/${guestSession._id}`,
        );
        const sentMessage = await smsService.send(
          twilioSubClient,
          `${twilioAccount.countryCode}${twilioAccount.phoneNumber}`,
          `${updatedGuest.countryCode}${updatedGuest.phoneNumber}`,
          `${updatedMessageBody.message}`,
        );

        const newMessage = await messageService.create(
          {
            propertyId: propertyId,
            guestId: updatedGuest._id,
            senderId: propertyId,
            receiverId: updatedGuest._id,
            content: sentMessage.body,
            messageSid: sentMessage.sid,
            messageType: messageType.SMS,
            messageTriggerType: messageTriggerType.AUTOMATIC,
            status: sentMessage.status,
          },
          session,
        );

        await chatListService.updateAndIncUnreadMessages(
          propertyId,
          updatedGuest._id,
          {
            latestMessage: newMessage._id,
          },
          session,
          0,
        );
      }
      // Get Message Template
      const guestSession = await guestSessionService.getGuestSession(
        propertyId,
        guestId,
      );
      const messageTemplate =
        await messageTemplateService.getByNameAndPropertyId(
          propertyId,
          guestStatusToTemplateOnUpdate(oldGuestStatus, updatedGuestStatus),
        );
      // Send Message
      if (messageTemplate && guest.phoneNumber && guest.countryCode) {
        const twilioAccount =
          await twilioAccountService.getByPropertyId(propertyId);
        if (!twilioAccount) {
          throw new NotFoundError("Twilio account not found", {
            propertyId: ["Twilio account not found for this property"],
          });
        }
        const propertySetting = await settingService.getByPropertyId(
          property._id,
        );
        const twilioSubClient =
          await twilioService.getTwilioClient(twilioAccount);
        const updatedMessageBody = modifyMessageTemplateBody(
          messageTemplate,
          updatedGuest,
          property,
          propertySetting,
          `${process.env.MOBILE_FRONTEND_URL}/${guestSession._id}`,
        );
        const sentMessage = await smsService.send(
          twilioSubClient,
          `${twilioAccount.countryCode}${twilioAccount.phoneNumber}`,
          `${updatedGuest.countryCode}${updatedGuest.phoneNumber}`,
          `${updatedMessageBody.message}`,
        );

        const newMessage = await messageService.create(
          {
            propertyId: propertyId,
            guestId: updatedGuest._id,
            senderId: propertyId,
            receiverId: updatedGuest._id,
            content: sentMessage.body,
            messageSid: sentMessage.sid,
            messageType: messageType.SMS,
            messageTriggerType: messageTriggerType.AUTOMATIC,
            status: sentMessage.status,
          },
          session,
        );

        await chatListService.updateAndIncUnreadMessages(
          propertyId,
          updatedGuest._id,
          {
            latestMessage: newMessage._id,
          },
          session,
          0,
        );
      }
    }
    await session.commitTransaction();
    session.endSession();

    // Trigger events
    // Emit to guest list updated
    req.app.io.to(`property:${propertyId}`).emit("guest:guestUpdate", {
      guest: { ...updatedGuest._doc, status: updatedGuestStatus },
    });
    // Emit to chat list updated
    req.app.io.to(`property:${propertyId}`).emit("chatList:update", {});
    // Emit to guest messages updated
    req.app.io.to(`guest:${guestId}`).emit("message:newMessage", {});
    return responseHandler(
      res,
      {
        guest: { ...updatedGuest._doc, status: updatedGuestStatus },
      },
      200,
      "Guest Updated",
    );
  } catch (e) {
    console.log("eeeeeeeeeee", e);
    await session.abortTransaction();
    session.endSession();
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

module.exports = {
  bookingCreate,
  bookingUpdate,
  bookingNoShowCancel,
  reservationCreate,
};
