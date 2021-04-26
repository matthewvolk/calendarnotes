const axios = require("axios");
const UserService = require("./UserService");

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
  /**
   * @param {object} user deserialized user object from Passport.js
   * @param {string} calendarId Google calendar ID
   * @returns {string} timezone string e.g., "America/Chicago"
   */
  getCalendarTimeZone = async (user, calendarId) => {
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
        let userServiceInstance = new UserService();
        let userWithRefreshedToken = await userServiceInstance.refreshToken(
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
  };
}

module.exports = CalendarService;
