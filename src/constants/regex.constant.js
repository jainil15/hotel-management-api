const phoneregex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
const datetimeregex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const nocountrycodephoneregex = /\d[0-9]{9}/;
const timeregex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
const countrycoderegex = /\+\d{1,4}$/;
const timezoneregex = /^GMT[+-]((0?[0-9]|1[0-1]):([0-5][0-9])|12:00)$/
module.exports = {
    phoneregex,
    datetimeregex,
    timeregex,
    nocountrycodephoneregex,
    countrycoderegex,
    timezoneregex
};
