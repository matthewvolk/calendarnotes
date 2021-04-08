const { startOfWeek, endOfWeek } = require("date-fns");

module.exports = {
  today: (request, response) => {
    /**
     * Input: N/A
     * Output: today's date, beginning of week, end of week
     *
     * Maybe refactor this so input is a date, and instead this provides start and end of week for that date
     */
    let today = new Date();
    let startOfCurrentWeek = startOfWeek(today).toISOString();
    let endOfCurrentWeek = endOfWeek(today).toISOString();
    response.json({
      today: today.toISOString(),
      startOfCurrentWeek,
      endOfCurrentWeek,
    });
  },
};
