// import { Request } from "express";

const { MessagingResponse } = require("twilio").twiml;
const { Guest } = require("../models/guest.model");
const { MessageValidationSchema, Message } = require("../models/message.model");
const { Property } = require("../models/property.model");

require("dotenv").config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);
const sendsms = async (req, res) => {
  try {
    const message = req.body;
    const result = MessageValidationSchema.safeParse(message);
    if (!result.success) {
      return res
        .status(400)
        .json({ error: result.error.flatten().fieldErrors });
    }
    // TODO: Move code to service
    const guest = await Guest.findById(req.params.guestId);
    const property = await Property.findById(req.params.propertyId);
    // TODO: status callback to check if message was sent
    const sentMessage = await client.messages.create({
      body: result.data.content,
      from: property.countryCode + property.phoneNumber,
      to: guest.countryCode + guest.phoneNumber,
    });

    const newMessage = await Message.create({
      ...result.data,
      propertyId: req.params.propertyId,
      guestId: req.params.guestId,
      senderId: req.params.propertyId,
      receiverId: req.params.guestId,
    });
    console.log("MESSAGE CONTROLLER: " + sentMessage);
    res.status(200).json({ result: { message: newMessage } });
  } catch (e) {
    res.status(500).json({ error: { server: "Internal Server Error" + e } });
  }
};

const incomingMessage = async (req, res) => {
  try {
    console.log("MESSAGE CONTROLLER: " + req.body);
    // console.log(req.body.formData);
    // console.log(req);
    const twiml = new MessagingResponse();
    // TODO: Move code to service
    const property = await Property.findOne({
      phoneNumber: req.body.To.substring(req.body.To.length - 10),
    });
    const guest = await Guest.findOne({
      phoneNumber: req.body.From.substring(req.body.To.length - 10),
      propertyId: property._id,
    });

    const newMessage = new Message({
      guestId: guest._id,
      propertyId: property._id,
      senderId: property._id,
      receiverId: guest._id,
      content: req.body.Body,
      messageType: "incoming",
      messageTriggerType: 0,
      active: true,
    });
    const savedMessage = await newMessage.save();
    twiml.message("Welcome to Onelyk \n https://www.onelyk.com");
    return res.status(200).type("text/xml").send(twiml.toString());
  } catch (e) {
    return res
      .status(500)
      .json({ error: { server: "Internal Server Error" + e } });
  }
};

const errorLogging = async (req, res) => {
  try {
    return res.status(200).json({ result: { message: "Error received" } });
  } catch (e) {
    return res
      .status(500)
      .json({ error: { server: "Internal Server Error" + e } });
  }
};

const status = async (req, res) => {
  try {
    console.log(req.body);
    return res.status(200).json({ result: { message: "Status received" } });
  } catch (e) {
    return res
      .status(500)
      .json({ error: { server: "Internal Server Error" + e } });
  }
};

module.exports = { sendsms, incomingMessage, errorLogging, status };


