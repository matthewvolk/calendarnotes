const { startOfWeek, endOfWeek, parseISO } = require("date-fns");
const { DateTime } = require("luxon");

class DateService {
  /**
   * @param {string} tz timezone string e.g., "America/Chicago"
   * @returns {string} an ISO 8601-compliant string representation of Luxon's DateTime e.g., '1982-05-25T00:00:00.000Z'
   */
  getDateTimeForTimezone = (tz) => {
    return DateTime.now().setZone(tz).toISO();
  };

  /**
   *
   * @param {string} date an ISO 8601-compliant string representation of Luxon's DateTime e.g., '1982-05-25T00:00:00.000Z'
   * @returns {object} an object with two properties containing ISO 8601-compliant string representations of Luxon's DateTime
   */
  getWeekStartAndEndForDate = (date) => {
    let startOfWeek = DateTime.fromISO(date).startOf("week").toISO();
    let endOfWeek = DateTime.fromISO(date).endOf("week").toISO();
    return {
      startOfWeek,
      endOfWeek,
    };
  };

  /**
   *
   * @param {string} date an ISO 8601-compliant string representation of Luxon's DateTime e.g., '1982-05-25T00:00:00.000Z'
   * @returns {string} user friendly start of week e.g., 'Thursday, December 20, 2012'
   */
  getUserFriendlyStartOfWeek = (date) => {
    return DateTime.fromISO(date).startOf("week").toLocaleString({
      weekday: "long",
      month: "long",
      day: "2-digit",
      year: "numeric",
    });
  };
}

module.exports = DateService;