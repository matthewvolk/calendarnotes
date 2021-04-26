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

  /**
   * @todo
   * 1) The date for each calendar week MUST be generated on the server, using the
   * timezone of the user's currently selected Google calendar. Otherwise the client and the
   * server run the risk of being out of sync. This could be as simple as plugging Step #2 below
   * into the current "getCalendarEvents" function in UserService.js
   *
   * 2) Add calendar service calendarTimeZone() which takes in param calendarId to get the timezone
   * of the calendar being viewed on the client. => DONE
   *
   * 3) Once the timezone is known, pass that calendar timezone to the date service to get the
   * current week being viewed.
   *
   * 4) The date service should return the 12:00:00 AM of the Sunday beginning the week, and the
   * 11:59:59 PM of the Saturday ending the week
   *
   * 5) This can be passed back to the calendar service to get the current week's events
   *
   * 6) The calendar service should pass the current week's events, as well as the week start date
   * back to the client.
   *
   * 7) The arrows on the client's "events" dashboard should have an onClick handler that, when clicked:
   * - Send the week's start date to the "getPreviousWeek" date service function if the back button is clicked
   * - Send the week's start date to the "getNextWeek" date service function if the next button is clicked
   *
   * 8) These getPrev/NextWeek functions should return the 12:00:00 AM of the Sunday beginning the new week,
   * and the 11:59:59 PM of the Saturday ending the new week, and then proceed to repeat Step #5 above.
   */
};
