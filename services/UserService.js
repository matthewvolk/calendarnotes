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
  async getUserCalendars(user) {
    let calendars;

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
        let userWithRefreshedToken = await this.refreshToken(user, "GOOGLE");

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

  async getCalendarEvents(user, calendarId /* timeMin, timeMax */) {
    let calendarEvents;
    let today = new Date();
    let timeMin = startOfWeek(today).toISOString();
    let timeMax = endOfWeek(today).toISOString();
    let url;

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
          Authorization: `Bearer ${user.google.accessToken}`,
        },
      });
      calendarEvents = response.data;
    } catch (err) {
      if (err.response && err.response.status === 401) {
        let userWithRefreshedToken = await this.refreshToken(user, "GOOGLE");

        try {
          const response = await axios({
            method: "get",
            url,
            headers: {
              Authorization: `Bearer ${userWithRefreshedToken.google.accessToken}`,
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

  async getFolders(user, clickedFolderId) {
    let folderResponse = null;

    if (!clickedFolderId) {
      // Specifically for Wrike, if client does not provide folder ID, you need to ask wrike for both the top level spaces, then folder/spaceId/folders in order to return childFolders: true or false.
      try {
        const response = await axios({
          method: "get",
          url: `https://${user.wrike.apiHost}/api/v4/spaces`,
          headers: {
            Authorization: `Bearer ${user.wrike.accessToken}`,
          },
        });
        folderResponse = { spaces: response.data };
      } catch (err) {
        if (err.response && err.response.status === 401) {
          let userWithRefreshedToken = await this.refreshToken(user, "WRIKE");

          try {
            const response = await axios({
              method: "get",
              url: `https://${userWithRefreshedToken.wrike.apiHost}/api/v4/spaces`,
              headers: {
                Authorization: `Bearer ${userWithRefreshedToken.wrike.accessToken}`,
              },
            });
            folderResponse = { spaces: response.data };
          } catch (err) {
            console.error(
              "Failed to retrieve Wrike folders in second try of getFolders()",
              err
            );
            folderResponse = null;
          }
        } else {
          console.error(
            "Call to get Wrike folders in getFolders() failed for some other reason than 401",
            err
          );
          folderResponse = null;
        }
      }

      if (folderResponse) {
        // refresh wrike token just in case its about to expire before Promise.all (if one promise fails, they all fail)
        let userWithRefreshedToken = await this.refreshToken(user, "WRIKE");

        let folderNamesAndIds = folderResponse.spaces.data.map((space) => {
          return { name: space.title, id: space.id };
        });

        let spaceChildFolderRequests = folderResponse.spaces.data.map(
          (space) => {
            let url = `https://${userWithRefreshedToken.wrike.apiHost}/api/v4/folders/${space.id}/folders`;
            let promise = axios({
              method: "get",
              url,
              headers: {
                Authorization: `Bearer ${userWithRefreshedToken.wrike.accessToken}`,
              },
            });
            return promise;
          }
        );
        let spaceFolders = await Promise.all(spaceChildFolderRequests);
        let spaceHasChildren = spaceFolders.map((spaceFolder) => {
          return spaceFolder.data.data[0].childIds == 0 ? false : true;
        });
        folderResponse = folderNamesAndIds.map((folder, index) => {
          return { ...folder, hasChildFolders: spaceHasChildren[index] };
        });
      }
    }

    if (clickedFolderId) {
      try {
        const response = await axios({
          method: "get",
          url: `https://${user.wrike.apiHost}/api/v4/folders/${clickedFolderId}/folders`,
          headers: {
            Authorization: `Bearer ${user.wrike.accessToken}`,
          },
        });
        folderResponse = response.data.data[0].childIds;
      } catch (err) {
        if (err.response && err.response.status === 401) {
          let userWithRefreshedToken = await this.refreshToken(user, "WRIKE");

          try {
            const response = await axios({
              method: "get",
              url: `https://${userWithRefreshedToken.wrike.apiHost}/api/v4/folders/${clickedFolderId}/folders`,
              headers: {
                Authorization: `Bearer ${userWithRefreshedToken.wrike.accessToken}`,
              },
            });
            folderResponse = response.data.data[0].childIds;
          } catch (err) {
            console.error(
              "Failed to retrieve Wrike folders in second try of getFolders() WITH QUERY PARAM",
              err
            );
            folderResponse = null;
          }
        } else {
          console.error(
            "Call to get Wrike folders in getFolders() WITH QUERY PARAM failed for some other reason than 401",
            err
          );
          folderResponse = null;
        }
      }

      if (folderResponse) {
        let userWithRefreshedToken = await this.refreshToken(user, "WRIKE");

        let getSpaceIdsAndNames = folderResponse.map((spaceId) => {
          let url = `https://${userWithRefreshedToken.wrike.apiHost}/api/v4/folders/${spaceId}/folders`;
          let promise = axios({
            method: "get",
            url,
            headers: {
              Authorization: `Bearer ${userWithRefreshedToken.wrike.accessToken}`,
            },
          });
          return promise;
        });

        /**
         * @todo Catch needs to return an Error object
         */

        try {
          let spaceIdsAndNames = await Promise.all(getSpaceIdsAndNames);
          folderResponse = spaceIdsAndNames.map((spaceIdAndName) => {
            return {
              name: spaceIdAndName.data.data[0].title,
              id: spaceIdAndName.data.data[0].id,
              hasChildFolders:
                spaceIdAndName.data.data[0].childIds == 0 ? false : true,
            };
          });
        } catch (err) {
          console.log("Promise.all() failed:", err);
          return { error: true };
        }
      }
    }

    return folderResponse;
  }

  async createNotesForEvent(user, folderId, eventId, calendarId) {
    let userWithRefreshedToken;

    let eventResponse;
    try {
      eventResponse = await axios({
        method: "get",
        url: `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
        headers: {
          Authorization: `Bearer ${user.google.accessToken}`,
        },
      });
      console.log("Retrieved Google Calendar Event!");
    } catch (err) {
      if (err.response && err.response.status === 401) {
        userWithRefreshedToken = await this.refreshToken(user, "GOOGLE");

        try {
          eventResponse = await axios({
            method: "get",
            url: `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
            headers: {
              Authorization: `Bearer ${userWithRefreshedToken.google.accessToken}`,
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
          Authorization: `Bearer ${user.google.accessToken}`,
        },
      });
      userTimeZone = userTimeZoneResponse.data.timeZone;
    } catch (err) {
      if (err.response && err.response.status === 401) {
        userWithRefreshedToken = await this.refreshToken(user, "GOOGLE");

        try {
          const secondUserTimeZoneResponse = await axios({
            method: "get",
            url: `https://www.googleapis.com/calendar/v3/users/me/calendarList/${calendarId}`,
            headers: {
              Authorization: `Bearer ${userWithRefreshedToken.google.accessToken}`,
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
        url: `https://${user.wrike.apiHost}/api/v4/contacts?me=true`,
        headers: {
          Authorization: `Bearer ${user.wrike.accessToken}`,
        },
      });
      wrikeBody.responsibles.push(wrikeContactResponse.data.data[0].id);
      console.log(
        "Retrieved Wrike Contact ID!",
        wrikeContactResponse.data.data[0].id
      );
    } catch (err) {
      if (err.response && err.response.status === 401) {
        userWithRefreshedToken = await this.refreshToken(user, "WRIKE");

        try {
          const secondWrikeContactResponse = await axios({
            method: "get",
            url: `https://${userWithRefreshedToken.wrike.apiHost}/api/v4/contacts?me=true`,
            headers: {
              Authorization: `Bearer ${userWithRefreshedToken.wrike.accessToken}`,
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
        url: `https://${user.wrike.apiHost}/api/v4/folders/${folderId}/tasks`,
        headers: {
          Authorization: `Bearer ${user.wrike.accessToken}`,
        },
        data: wrikeBody,
      });
      console.log("Created Wrike Task!");
    } catch (err) {
      if (err.response && err.response.status === 401) {
        userWithRefreshedToken = await this.refreshToken(user, "WRIKE");

        try {
          wrikeResponse = await axios({
            method: "post",
            url: `https://${userWithRefreshedToken.wrike.apiHost}/api/v4/folders/${folderId}/tasks`,
            headers: {
              Authorization: `Bearer ${userWithRefreshedToken.wrike.accessToken}`,
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

    try {
      googleEventCreationResponse = await axios({
        method: "post",
        url: `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
        headers: {
          Authorization: `Bearer ${user.google.accessToken}`,
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
        userWithRefreshedToken = await this.refreshToken(user, "GOOGLE");

        try {
          googleEventCreationResponse = await axios({
            method: "post",
            url: `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
            headers: {
              Authorization: `Bearer ${userWithRefreshedToken.google.accessToken}`,
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

  async refreshToken(user, provider) {
    if (!provider) {
      return new RangeError(
        "Paramater 'provider' must be provided as a string and equal to either 'GOOGLE' or 'WRIKE'"
      );
    }

    console.log(
      `RERESHING ${provider} TOKEN IN refreshToken() for user ${user}`
    );

    const urls = {
      GOOGLE: `https://oauth2.googleapis.com/token?client_id=${process.env.GOOGLE_OAUTH2_CLIENT_ID}&client_secret=${process.env.GOOGLE_OAUTH2_CLIENT_SECRET}&grant_type=refresh_token&refresh_token=${user.google.refreshToken}`,
      WRIKE: `https://${user.wrike.apiHost}/oauth2/token?client_id=${process.env.WRIKE_OAUTH2_CLIENT_ID}&client_secret=${process.env.WRIKE_OAUTH2_CLIENT_SECRET}&grant_type=refresh_token&refresh_token=${user.wrike.refreshToken}`,
    };

    try {
      const response = await axios({
        method: "post",
        url: urls[provider],
      });

      let userWithRefreshedToken = null;

      if (provider === "GOOGLE") {
        userWithRefreshedToken = await UserModel.findOneAndUpdate(
          { "google.id": user.google.id },
          {
            "google.accessToken": response.data.access_token,
            "google.tokenType": response.data.token_type,
            "google.tokenExpiresIn": response.data.expires_in,
            "google.accessScopes": response.data.scope,
          },
          { new: true }
        ).exec();
        console.log(
          `REFRESHED ${provider} TOKEN IN refreshToken() for user ${userWithRefreshedToken}`
        );
      } else if (provider === "WRIKE") {
        userWithRefreshedToken = await UserModel.findOneAndUpdate(
          { "google.id": user.google.id },
          {
            "wrike.accessToken": response.data.access_token,
            "wrike.refreshToken": response.data.refresh_token,
            "wrike.apiHost": response.data.host,
            "wrike.tokenType": response.data.token_type,
            "wrike.tokenExpiresIn": response.data.expires_in,
          },
          { new: true }
        ).exec();
        console.log(
          `REFRESHED ${provider} TOKEN IN refreshToken() for user ${userWithRefreshedToken}`
        );
      }

      return userWithRefreshedToken;
    } catch (err) {
      console.error("Problem in refreshToken()", err);
    }
  }
}

module.exports = UserService;
