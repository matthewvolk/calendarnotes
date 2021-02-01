const UserModel = require("../models/User");
const axios = require("axios");
const moment = require("moment-timezone");
const {
  startOfWeek,
  endOfWeek,
  differenceInMinutes,
  parseISO,
  format,
} = require("date-fns");

/**
 * @todo Error handling, what do I return in the event there is an error?
 */

class UserService {
  async getUser(googleId) {
    try {
      const user = await UserModel.findOne({ googleId }).exec();
      return user;
    } catch (err) {
      return null;
    }
  }

  async getUserCalendars(userId) {
    let user;
    let calendars;
    try {
      user = await this.getUser(userId);
    } catch (err) {
      console.error(
        "Failed to retrieve user document in getUserCalendars()",
        err
      );
    }

    try {
      const response = await axios({
        method: "get",
        url: `https://www.googleapis.com/calendar/v3/users/me/calendarList`,
        headers: {
          Authorization: `Bearer ${user.googleAccessToken}`,
        },
      });
      calendars = response.data.items;
    } catch (err) {
      if (err.response && err.response.status === 401) {
        let userWithRefreshedToken = await this.refreshGoogleToken(
          userId,
          user.googleRefreshToken
        );

        try {
          const response = await axios({
            method: "get",
            url: `https://www.googleapis.com/calendar/v3/users/me/calendarList`,
            headers: {
              Authorization: `Bearer ${userWithRefreshedToken.googleAccessToken}`,
            },
          });
          calendars = response.data.items;
        } catch (err) {
          console.error(
            "Failed to retrieve calendars in second try of getUserCalendars()",
            err
          );
        }
      } else {
        console.error(
          "Call to get calendars in getUserCalendars() failed for some other reason than 401",
          err
        );
      }
    }

    /**
     * @todo ERROR HANDLING
     * If calendars is empty, return something to trigger an error on client
     */
    return calendars;
  }

  async getCalendarEvents(userId, calendarId /* timeMin, timeMax */) {
    let user;
    let calendarEvents;
    let today = new Date();
    let timeMin = startOfWeek(today).toISOString();
    let timeMax = endOfWeek(today).toISOString();
    let url;

    try {
      user = await this.getUser(userId);
    } catch (err) {
      console.error(
        "Failed to retrieve user document in getUserCalendars()",
        err
      );
    }

    if (timeMax && timeMin) {
      url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?timeMax=${timeMax}&timeMin=${timeMin}&singleEvents=true`;
    } else {
      url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`;
    }
    try {
      const response = await axios({
        method: "get",
        url,
        headers: {
          Authorization: `Bearer ${user.googleAccessToken}`,
        },
      });
      calendarEvents = response.data;
    } catch (err) {
      if (err.response && err.response.status === 401) {
        let userWithRefreshedToken = await this.refreshGoogleToken(
          userId,
          user.googleRefreshToken
        );

        try {
          const response = await axios({
            method: "get",
            url,
            headers: {
              Authorization: `Bearer ${userWithRefreshedToken.googleAccessToken}`,
            },
          });
          calendarEvents = response.data;
        } catch (err) {
          console.error(
            "Failed to retrieve calendar events in second try of getCalendarEvents()",
            err
          );
        }
      } else {
        console.error(
          "Call to get calendar events in getCalendarEvents() failed for some other reason than 401",
          err
        );
      }
    }

    /**
     * @todo ERROR HANDLING
     * If calendarEvents is empty, return something to trigger an error on client
     */
    return calendarEvents;
  }

  async getWrikeFolders(userId) {
    let user;
    let folders;

    try {
      user = await this.getUser(userId);
    } catch (err) {
      console.error(
        "Failed to retrieve user document in getWrikeFolders()",
        err
      );
    }

    try {
      const response = await axios({
        method: "get",
        url: `https://${user.wrikeHost}/api/v4/folders`,
        headers: {
          Authorization: `Bearer ${user.wrikeAccessToken}`,
        },
      });
      folders = { spaces: response.data };
    } catch (err) {
      if (err.response && err.response.status === 401) {
        let userWithRefreshedToken = await this.refreshWrikeToken(
          userId,
          user.wrikeRefreshToken
        );

        try {
          const response = await axios({
            method: "get",
            url: `https://${userWithRefreshedToken.wrikeHost}/api/v4/folders`,
            headers: {
              Authorization: `Bearer ${userWithRefreshedToken.wrikeAccessToken}`,
            },
          });
          folders = { spaces: response.data };
        } catch (err) {
          console.error(
            "Failed to retrieve Wrike folders in second try of getWrikeFolders()",
            err
          );
        }
      } else {
        console.error(
          "Call to get Wrike folders in getWrikeFolders() failed for some other reason than 401",
          err
        );
      }
    }

    /**
     * @todo ERROR HANDLING
     * If folders is empty, return something to trigger an error on client
     */
    return folders;
  }

  async createNotesForEvent(userId, folderId, eventId, calendarId) {
    let user;
    let userWithRefreshedToken;

    try {
      user = await this.getUser(userId);
    } catch (err) {
      console.error(
        "Failed to retrieve user document in createNotesForEvent()",
        err
      );
    }

    let eventResponse;
    try {
      eventResponse = await axios({
        method: "get",
        url: `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
        headers: {
          Authorization: `Bearer ${user.googleAccessToken}`,
        },
      });
      console.log("Retrieved Google Calendar Event!");
    } catch (err) {
      if (err.response && err.response.status === 401) {
        userWithRefreshedToken = await this.refreshGoogleToken(
          userId,
          user.googleRefreshToken
        );

        try {
          eventResponse = await axios({
            method: "get",
            url: `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
            headers: {
              Authorization: `Bearer ${userWithRefreshedToken.googleAccessToken}`,
            },
          });
          console.log("Retrieved Google Calendar Event!");
        } catch (err) {
          console.error(
            "Failed to retrieve event in createNotesForEvent() for a second time",
            err
          );
        }
      } else {
        console.error(
          "Call to get event in createNotesForEvent() failed for some other reason than 401",
          err
        );
      }
    }

    let userTimeZone;
    try {
      const userTimeZoneResponse = await axios({
        method: "get",
        url: `https://www.googleapis.com/calendar/v3/users/me/calendarList/${calendarId}`,
        headers: {
          Authorization: `Bearer ${user.googleAccessToken}`,
        },
      });
      userTimeZone = userTimeZoneResponse.data.timeZone;
    } catch (err) {
      if (err.response && err.response.status === 401) {
        userWithRefreshedToken = await this.refreshGoogleToken(
          userId,
          user.googleRefreshToken
        );

        try {
          const secondUserTimeZoneResponse = await axios({
            method: "get",
            url: `https://www.googleapis.com/calendar/v3/users/me/calendarList/${calendarId}`,
            headers: {
              Authorization: `Bearer ${userWithRefreshedToken.googleAccessToken}`,
            },
          });
          userTimeZone = secondUserTimeZoneResponse.data.timeZone;
        } catch (err) {
          console.error(
            "Failed to retrieve userTimeZone in createNotesForEvent() for a second time",
            err
          );
        }
      } else {
        console.error(
          "Call to get userTimeZone in createNotesForEvent() failed for some other reason than 401",
          err
        );
      }
    }

    /**
     * @todo below, handle case of all-day events where there is no datetime
     */

    let eventStartTime = new Date(eventResponse.data.start.dateTime); // "2020-12-21T13:00:00-06:00"
    let eventEndTime = new Date(eventResponse.data.end.dateTime); // "2020-12-21T13:30:00-06:00"

    let momentStart = moment
      .tz(eventStartTime, userTimeZone)
      .format("dddd, MMMM Do ⋅ h:mma");
    let momentEnd = moment.tz(eventEndTime, userTimeZone).format("h:mma z");

    let wrikeBody = {};
    wrikeBody.title = `${eventResponse.data.summary} - ${momentStart} - ${momentEnd}`;
    wrikeBody.description = `<h4><b>Attendees</b></h4><ul>`;
    if (eventResponse.data.attendees) {
      eventResponse.data.attendees.forEach((obj, index) => {
        wrikeBody.description += `<li><a href="mailto:${obj.email}">${obj.email}</a></li>`;
      });
    } else {
      wrikeBody.description += `<li><a href="mailto:${eventResponse.data.organizer.email}">${eventResponse.data.organizer.email}</a></li>`;
    }
    wrikeBody.description += `</ul><h4><b>Meeting Notes</b></h4><ul><label><li></li></label></ul><h4><b>Action Items</b></h4><ul class='checklist' style='list-style-type: none;'><li><label><input type='checkbox' /></label></li></ul>`;
    wrikeBody.dates = {};
    wrikeBody.dates.type = "Planned";
    wrikeBody.dates.duration = differenceInMinutes(
      parseISO(eventResponse.data.end.dateTime),
      parseISO(eventResponse.data.start.dateTime)
    );
    wrikeBody.dates.start = format(
      parseISO(eventResponse.data.start.dateTime),
      "yyyy-MM-dd'T'HH:mm:ss"
    );
    wrikeBody.dates.due = format(
      parseISO(eventResponse.data.end.dateTime),
      "yyyy-MM-dd'T'HH:mm:ss"
    );

    wrikeBody.responsibles = [];

    try {
      const wrikeContactResponse = await axios({
        method: "get",
        url: `https://${user.wrikeHost}/api/v4/contacts?me=true`,
        headers: {
          Authorization: `Bearer ${user.wrikeAccessToken}`,
        },
      });
      wrikeBody.responsibles.push(wrikeContactResponse.data.data[0].id);
      console.log(
        "Retrieved Wrike Contact ID!",
        wrikeContactResponse.data.data[0].id
      );
    } catch (err) {
      if (err.response && err.response.status === 401) {
        userWithRefreshedToken = await this.refreshWrikeToken(
          userId,
          user.wrikeRefreshToken
        );

        try {
          const secondWrikeContactResponse = await axios({
            method: "get",
            url: `https://${userWithRefreshedToken.wrikeHost}/api/v4/contacts?me=true`,
            headers: {
              Authorization: `Bearer ${userWithRefreshedToken.wrikeAccessToken}`,
            },
          });
          wrikeBody.responsibles.push(
            secondWrikeContactResponse.data.data[0].id
          );
          console.log(
            "Retrieved Wrike Contact ID!",
            secondWrikeContactResponse.data.data[0].id
          );
        } catch (err) {
          console.error(
            "Failed to retrieve wrikeContact in createNotesForEvent() for a second time",
            err
          );
        }
      } else {
        console.error(
          "Call to get wrikeContact in createNotesForEvent() failed for some other reason than 401",
          err
        );
      }
    }

    let wrikeResponse;

    try {
      wrikeResponse = await axios({
        method: "post",
        url: `https://${user.wrikeHost}/api/v4/folders/${folderId}/tasks`,
        headers: {
          Authorization: `Bearer ${user.wrikeAccessToken}`,
        },
        data: wrikeBody,
      });
      console.log("Created Wrike Task!");
    } catch (err) {
      if (err.response && err.response.status === 401) {
        userWithRefreshedToken = await this.refreshWrikeToken(
          userId,
          user.wrikeRefreshToken
        );

        try {
          wrikeResponse = await axios({
            method: "post",
            url: `https://${userWithRefreshedToken.wrikeHost}/api/v4/folders/${folderId}/tasks`,
            headers: {
              Authorization: `Bearer ${userWithRefreshedToken.wrikeAccessToken}`,
            },
            data: wrikeBody,
          });
          console.log("Created Wrike Task!");
        } catch (err) {
          console.error(
            "Failed to create Wrike task in createNotesForEvent() for a second time",
            err
          );
        }
      } else {
        console.error(
          "Call to create Wrike task in createNotesForEvent() failed for some other reason than 401",
          err
        );
      }
    }

    let googleEventCreationResponse;

    // GOOD ABOVE HERE =============================================================================

    try {
      googleEventCreationResponse = await axios({
        method: "post",
        url: `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
        headers: {
          Authorization: `Bearer ${user.googleAccessToken}`,
        },
        data: {
          summary: "_Notes",
          description: wrikeResponse.data.data[0].permalink,
          start: {
            dateTime: eventResponse.data.start.dateTime,
          },
          end: {
            dateTime: eventResponse.data.end.dateTime,
          },
          reminders: {
            useDefault: false,
          },
          colorId: "8",
        },
      });
      console.log("Created Google Calendar Notes Task!");
      return { status: 200, message: "Success!" };
    } catch (err) {
      if (err.response && err.response.status === 401) {
        userWithRefreshedToken = await this.refreshGoogleToken(
          userId,
          user.googleRefreshToken
        );

        try {
          googleEventCreationResponse = await axios({
            method: "post",
            url: `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
            headers: {
              Authorization: `Bearer ${userWithRefreshedToken.googleAccessToken}`,
            },
            data: {
              summary: "_Notes",
              description: wrikeResponse.data.data[0].permalink,
              start: {
                dateTime: eventResponse.data.start.dateTime,
              },
              end: {
                dateTime: eventResponse.data.end.dateTime,
              },
              reminders: {
                useDefault: false,
              },
              colorId: "8",
            },
          });
          console.log("Created Google Calendar Notes Task!");
          return { status: 200, message: "Success!" };
        } catch (err) {
          console.error(
            "Failed to create Google Notes event in createNotesForEvent() for a second time",
            err
          );
        }
      } else {
        console.error(
          "Call to create Google Notes event in createNotesForEvent() failed for some other reason than 401",
          err
        );
      }
    }
  }

  /**
   * @todo refactor both functions below to just "refreshToken(provider, userId, token)"
   */
  async refreshGoogleToken(userId, googleRefreshToken) {
    try {
      const response = await axios({
        method: "post",
        url: `https://oauth2.googleapis.com/token?client_id=${process.env.GOOGLE_OAUTH2_CLIENT_ID}&client_secret=${process.env.GOOGLE_OAUTH2_CLIENT_SECRET}&grant_type=refresh_token&refresh_token=${googleRefreshToken}`,
      });
      const userWithRefreshedToken = await UserModel.findOneAndUpdate(
        { googleId: userId },
        {
          googleAccessToken: response.data.access_token,
          googleTokenType: response.data.token_type,
          googleTokenExpiresIn: response.data.expires_in,
          googleScopes: response.data.scope,
        },
        { new: true }
      ).exec();
      return userWithRefreshedToken;
    } catch (err) {
      /**
       * @todo change to return error object?
       */
      console.error("Problem in refreshGoogleToken()", err);
      return false;
    }
  }

  async refreshWrikeToken(userId, wrikeRefreshToken) {
    let user;

    try {
      user = await this.getUser(userId);
    } catch (err) {
      console.error(
        "Failed to retrieve user document in refreshWrikeToken()",
        err
      );
    }

    try {
      const response = await axios({
        method: "post",
        url: `https://${user.wrikeHost}/oauth2/token?client_id=${process.env.WRIKE_OAUTH2_CLIENT_ID}&client_secret=${process.env.WRIKE_OAUTH2_CLIENT_SECRET}&grant_type=refresh_token&refresh_token=${wrikeRefreshToken}`,
      });
      const userWithRefreshedToken = await UserModel.findOneAndUpdate(
        { googleId: userId },
        {
          wrikeAccessToken: response.data.access_token,
          wrikeRefreshToken: response.data.refresh_token,
          wrikeHost: response.data.host,
          wrikeTokenType: response.data.token_type,
          wrikeTokenExpiresIn: response.data.expires_in,
        },
        { new: true }
      ).exec();
      return userWithRefreshedToken;
    } catch (err) {
      /**
       * @todo
       */
      console.error("Problem in refreshWrikeToken()", err);
      return false;
    }
  }

  async refreshToken(provider, userId, token) {
    /**
     * @todo maybe don't need token if I can use userID to get token based on provider param
     */

    // if (providerIsWrike) {
    //   getWrikeHostFromUserDocument()
    //   getRefreshTokenFromUserDocument()
    // } else {
    //   getRefreshTokenFromUserDocument()
    // }

    let wrikeHost;
    const urls = {
      google: `https://oauth2.googleapis.com/token?client_id=${process.env.GOOGLE_OAUTH2_CLIENT_ID}&client_secret=${process.env.GOOGLE_OAUTH2_CLIENT_SECRET}&grant_type=refresh_token&refresh_token=${token}`,
      wrike: `https://${wrikeHost}/oauth2/token?client_id=${process.env.WRIKE_OAUTH2_CLIENT_ID}&client_secret=${process.env.WRIKE_OAUTH2_CLIENT_SECRET}&grant_type=refresh_token&refresh_token=${token}`,
    };
    try {
      const response = await axios({
        method: "post",
        url: urls[provider],
      });
      const userWithRefreshedToken = await UserModel.findOneAndUpdate(
        { googleId: userId },
        {
          // wrike or googleAccessToken
          // wrikeRefreshToken
          // wrike or googleTokenType
          // wrikeHost
          // wrike or googleTokenExpiresIn
          // googleScopes
        },
        { new: true }
      ).exec();
      return userWithRefreshedToken;
    } catch (err) {}
  }
}

module.exports = UserService;
