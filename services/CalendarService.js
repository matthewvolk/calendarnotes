const axios = require("axios");
const DateService = require("./DateService");
const TokenService = require("./TokenService");

const logAxiosErrors = (err) => {
  if (err.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error(err.response.data);
    console.error(err.response.status);
    console.error(err.response.headers);
  } else if (err.request) {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    console.error(err.request);
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error("Error", err.message);
  }
  console.error(err.config);
};

class CalendarService {
  async getUserCalendars(user) {
    let calendars = null;

    try {
      const response = await axios({
        method: "get",
        url: `https://www.googleapis.com/calendar/v3/users/me/calendarList`,
        headers: {
          Authorization: `Bearer ${user.google.accessToken}`,
        },
      });
      calendars = response.data.items;
    } catch (err) {
      if (err.response && err.response.status === 401) {
        const tokenService = new TokenService();
        const userWithRefreshedToken = await tokenService.refreshToken(
          user,
          "GOOGLE"
        );

        try {
          const response = await axios({
            method: "get",
            url: `https://www.googleapis.com/calendar/v3/users/me/calendarList`,
            headers: {
              Authorization: `Bearer ${userWithRefreshedToken.google.accessToken}`,
            },
          });
          calendars = response.data.items;
        } catch (err) {
          logAxiosErrors(err);
        }
      } else {
        logAxiosErrors(err);
      }
    }

    return calendars;
  }

  /**
   * @param {object} user deserialized user object from Passport.js
   * @param {string} calendarId Google calendar ID
   * @returns {string} timezone string e.g., "America/Chicago"
   */
  async getCalendarTimeZone(user, calendarId) {
    try {
      let response = await axios({
        method: "get",
        url: `https://www.googleapis.com/calendar/v3/calendars/${calendarId}`,
        headers: {
          Authorization: `Bearer ${user.google.accessToken}`,
        },
      });
      let calendarTimeZone = response.data.timeZone;
      return calendarTimeZone;
    } catch (err) {
      if (err.response && err.response.status === 401) {
        const tokenService = new TokenService();
        const userWithRefreshedToken = await tokenService.refreshToken(
          user,
          "GOOGLE"
        );
        try {
          response = await axios({
            method: "get",
            url: `https://www.googleapis.com/calendar/v3/calendars/${calendarId}`,
            headers: {
              Authorization: `Bearer ${userWithRefreshedToken.google.accessToken}`,
            },
          });
          calendarTimeZone = response.data.timeZone;
          return calendarTimeZone;
        } catch (err) {
          logAxiosErrors(err);
        }
      } else {
        logAxiosErrors(err);
      }
    }
  }

  async getCalEventsForWeek(user, calendarId, weekOf) {
    let eventsResponse = {};
    let url;
    let dateServiceInstance = new DateService();
    let {
      startOfWeek,
      endOfWeek,
    } = dateServiceInstance.getWeekStartAndEndForDate(weekOf);
    /**
     * @todo if (dateString), skip the steps above and instead,
     * get the previous or next week relative to dateString.
     */
    let userFriendlyStartOfWeek = dateServiceInstance.getUserFriendlyStartOfWeek(
      weekOf
    );

    url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?timeMin=${encodeURIComponent(
      startOfWeek
    )}&timeMax=${encodeURIComponent(endOfWeek)}&singleEvents=true`;

    try {
      const response = await axios({
        method: "get",
        url,
        headers: {
          Authorization: `Bearer ${user.google.accessToken}`,
        },
      });
      let calendarEventsResponse = response.data;
      let eventsResponseMinusCancelledEvents = calendarEventsResponse.items.filter(
        (obj) => obj.start
      );
      let eventsOrderedByEarliestFirst = eventsResponseMinusCancelledEvents.sort(
        (a, b) => {
          return (
            new Date(a.start.dateTime).getTime() -
            new Date(b.start.dateTime).getTime()
          );
        }
      );
      eventsResponse.startOfWeekISO = startOfWeek;
      eventsResponse.startOfWeek = userFriendlyStartOfWeek;
      eventsResponse.events = eventsOrderedByEarliestFirst;
    } catch (err) {
      if (err.response && err.response.status === 401) {
        const tokenService = new TokenService();
        const userWithRefreshedToken = await tokenService.refreshToken(
          user,
          "GOOGLE"
        );

        try {
          const response = await axios({
            method: "get",
            url,
            headers: {
              Authorization: `Bearer ${userWithRefreshedToken.google.accessToken}`,
            },
          });
          let calendarEventsResponse = response.data;
          let eventsResponseMinusCancelledEvents = calendarEventsResponse.items.filter(
            (obj) => obj.start
          );
          let eventsOrderedByEarliestFirst = eventsResponseMinusCancelledEvents.sort(
            (a, b) => {
              return (
                new Date(a.start.dateTime).getTime() -
                new Date(b.start.dateTime).getTime()
              );
            }
          );
          eventsResponse.startOfWeekISO = startOfWeek;
          eventsResponse.startOfWeek = userFriendlyStartOfWeek;
          eventsResponse.events = eventsOrderedByEarliestFirst;
        } catch (err) {
          console.error(
            "Failed to retrieve calendar events in second try of getCalEventsForWeek()",
            err
          );
        }
      } else {
        console.error(
          "Call to get calendar events in getCalEventsForWeek() failed for some other reason than 401",
          err
        );
      }
    }
    return eventsResponse;
  }
}

module.exports = CalendarService;
