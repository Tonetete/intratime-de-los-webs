const moment = require("moment");

const getDateFormat = () => moment().format("YYYY-MM-DD HH:mm:ss");

const getToday = () => moment().format("YYYY-MM-DD");

const getMonday = () =>
  moment()
    .weekday(0)
    .add(1, "days")
    .format("YYYY-MM-DD");

const formatSecondsToHoursAndMinutes = seconds =>
  moment.duration(seconds, "seconds").format("HH[h] m[m]");

const diffTimesInSeconds = (date1, date2) =>
  Math.abs(moment(date1).diff(moment(date2), "seconds"));

module.exports = {
  diffTimesInSeconds,
  getDateFormat,
  getMonday,
  getToday,
  formatSecondsToHoursAndMinutes
};
