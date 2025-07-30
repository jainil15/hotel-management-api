const { google } = require("googleapis");
const path = require("path");
const credentials = require("../data/credentials.json"); // downloaded JSON

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

async function appendRowToSheet(sheetName, dataArray) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const spreadsheetId = "1IAFmgIXT2MCCUY5RJ9zTuyQMzT1bqjpNqBkIBVxci_w"; // Your sheet ID

  const range = `${sheetName}!A1`; // Sheet tab name with range (starts at A1, it auto-appends)

  const values = [
    [...dataArray, new Date().toLocaleString()], // Add timestamp at end
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });

  console.log(`✅ Row added to sheet '${sheetName}'`);
}
// appendContactRow({ name: "ravi", email: "1@2.com", message: "Hi" });
module.exports = {
  appendRowToSheet,
};
