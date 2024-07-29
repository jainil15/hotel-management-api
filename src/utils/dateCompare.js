const { date, z } = require("zod");
const { dateregex } = require("../constants/regex.constant");

const compareDate = (date1, date2) => {
  date1 = new Date(date1).toISOString();
  date2 = new Date(date2).toISOString();
  if (
    new Date(date1.split("T")[0]).getTime() ===
    new Date(date2.split("T")[0]).getTime()
  ) {
    return true;
  }
  return false;
};

const dateValidation = (date) => {
  return dateregex.test(date) && !isNaN(Date.parse(date));
};
const zodCustomDateValidation = (date, path) => {
  return z
    .string()
    .refine(
      (date) => {
        return dateValidation(date);
      },
      { message: "Invalid Date", path: [path] }
    )
    .safeParse(date);
};


module.exports = { compareDate, dateValidation, zodCustomDateValidation };
