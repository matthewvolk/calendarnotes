const axios = require("axios");
const UserModel = require("../models/User");
const DateService = require("./DateService");
const TokenService = require("./TokenService");

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
      if (response.status === 200) {
        calendars = response.data.items;
      }
      if (response.status !== 200) {
        calendars = null;
      }
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
          if (response.status === 200) {
            calendars = response.data.items;
          }
          if (response.status !== 200) {
            calendars = null;
          }
        } catch (err) {
          calendars = null;
        }
      } else {
        calendars = null;
      }
    }

    return calendars;
  }

  async updateDefaultCalendar(user, calendarId) {
    const userDoc = await UserModel.findOne({ "google.id": user.google.id });
    userDoc.defaultCalendar = calendarId;
    await userDoc.save();
    return userDoc.defaultCalendar;
  }
  /**
   * @param {object} user deserialized user object from Passport.js
   * @param {string} calendarId Google calendar ID
   * @returns {string | null} timezone string e.g., "America/Chicago" or null if error occurred
   */
  async getCalendarTimeZone(user, calendarId) {
    let calendarTimeZone = null;
    try {
      let response = await axios({
        method: "get",
        url: `https://www.googleapis.com/calendar/v3/calendars/${calendarId}`,
        headers: {
          Authorization: `Bearer ${user.google.accessToken}`,
        },
      });
      if (response.status === 200) {
        calendarTimeZone = response.data.timeZone;
      }
      if (response.status !== 200) {
        calendarTimeZone = null;
      }
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
          if (response.status === 200) {
            calendarTimeZone = response.data.timeZone;
          }
          if (response.status !== 200) {
            calendarTimeZone = null;
          }
        } catch (err) {
          calendarTimeZone = null;
        }
      } else {
        calendarTimeZone = null;
      }
    }
    return calendarTimeZone;
  }

  async getCalEventsForWeek(user, calendarId, weekOf) {
    let url = null;
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

    let eventsResponse = null;
    try {
      const response = await axios({
        method: "get",
        url,
        headers: {
          Authorization: `Bearer ${user.google.accessToken}`,
        },
      });
      if (response.status === 200) {
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
        eventsResponse = {
          startOfWeekISO: startOfWeek,
          startOfWeek: userFriendlyStartOfWeek,
          events: eventsOrderedByEarliestFirst,
        };
      }
      if (response.status !== 200) {
        eventsResponse = null;
      }
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
          if (response.status === 200) {
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
            eventsResponse = {
              startOfWeekISO: startOfWeek,
              startOfWeek: userFriendlyStartOfWeek,
              events: eventsOrderedByEarliestFirst,
            };
          }
          if (response.status !== 200) {
            eventsResponse = null;
          }
        } catch (err) {
          eventsResponse = null;
        }
      } else {
        eventsResponse = null;
      }
    }
    return eventsResponse;
  }
}

module.exports = CalendarService;
