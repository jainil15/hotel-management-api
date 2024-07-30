const { Connection, default: mongoose } = require("mongoose");
const request = require("supertest");
const { Connect } = require("../lib/db");
const { Otp } = require("../models/otp.model");
const app = require("../app/index").createApp();

describe("User Tests", () => {
  const email = "jainilpatel145@gmail.com";
  const password = "123456";
  beforeAll(async () => {
    require("dotenv").config();
    await Connect(process.env.MONGO_URL_TEST);
  });

  test("Register user", async () => {
    const response = await request(app).post("/user/register").send({
      email: email,
      password: password,
      firstName: "Jainil",
      lastName: "Patel",
    });
    
    expect(response.status).toBe(201);
  });
  test("Verify Otp", async () => {
    const otp = await Otp.findOne({ "user.email": email });
    const response = await request(app)
      .post("/auth/verifyOtp")
      .send({
        email: email,
        otp: otp.otp,
      });
    expect(response.status).toBe(201);
  });
  test("should return 404", async () => {
    const response = await request(app).post("/user/login").send({
      email: email,
      password: "wrongpassword",
    });
    expect(response.status).toBe(401);
  });

  test("should return 200", async () => {
    const response = await request(app).post("/user/login").send({
      email: email,
      password: password,
    });
    expect(response.status).toBe(200);
  });

  afterAll(async () => {
    
  });
});
