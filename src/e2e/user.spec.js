describe("buy a number", () => {
  it("should buy a number", async () => {
    const twilioAccount = {
      phoneNumber: "",
      countryCode: "",
    };
    const incomingPhoneNumber = {
      phoneNumber: "+911234567890",
    };
    twilioAccount.phoneNumber = incomingPhoneNumber.phoneNumber.slice(-10);
    twilioAccount.countryCode = incomingPhoneNumber.phoneNumber.slice(
      0,
      incomingPhoneNumber.phoneNumber.length - 10,
    );
    expect(twilioAccount.phoneNumber).toBe("1234567890");
    expect(twilioAccount.countryCode).toBe("+91");
  });
});
