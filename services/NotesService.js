const axios = require("axios");
const { DateTime } = require("luxon");
const CalendarService = require("./CalendarService");
const TokenService = require("./TokenService");

class NotesService {
  async createNotesForEvent(user, folderId, eventId, calendarId) {
    // Can we assume user.notesStorage.current will always be in sync b/t client/server?

    /**
     * @todo IF ANYTHING PAST THIS POINT FAILS, ABORT THE WHOLE THING AND LET CLIENT KNOW
     */
    let calendarEvent = null;
    try {
      const calendarEventResponse = await axios({
        method: "get",
        url: `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
        headers: {
          Authorization: `Bearer ${user.google.accessToken}`,
        },
      });
      if (calendarEventResponse.status === 200) {
        calendarEvent = calendarEventResponse.data;
      }
      if (calendarEventResponse.status !== 200) {
        calendarEvent = null;
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        const tokenService = new TokenService();
        const userWithRefreshedToken = await tokenService.refreshToken(
          user,
          "GOOGLE"
        );
        try {
          const calendarEventResponse = await axios({
            method: "get",
            url: `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
            headers: {
              Authorization: `Bearer ${userWithRefreshedToken.google.accessToken}`,
            },
          });
          if (calendarEventResponse.status === 200) {
            calendarEvent = calendarEventResponse.data;
          }
          if (calendarEventResponse.status !== 200) {
            calendarEvent = null;
          }
        } catch (err) {
          calendarEvent = null;
        }
      } else {
        calendarEvent = null;
      }
    }

    if (!calendarEvent)
      return {
        error: true,
        message: "Failed to retrieve Google Calendar Event",
      };

    let calendarService = new CalendarService();
    let userTz = await calendarService.getCalendarTimeZone(user, calendarId);
    console.log(">>>>>>>>>>>>>>> Calendar Timezone", userTz);

    let eventStartTime = DateTime.fromISO(calendarEvent.start.dateTime);
    eventStartTime = eventStartTime.setZone(userTz);
    eventStartTime = eventStartTime.toFormat("cccc, LLLL d ⋅ h:mm a");
    let eventEndTime = DateTime.fromISO(calendarEvent.end.dateTime);
    eventEndTime = eventEndTime.setZone(userTz);
    eventEndTime = eventEndTime.toFormat("h:mm a ZZZZ");

    let debugging = DateTime.fromISO(calendarEvent.start.dateTime);
    console.log(
      ">>>>>>>>>>>>>>> DateTime.fromISO(calendarEvent.start.dateTime)",
      DateTime.fromISO(calendarEvent.start.dateTime)
    );
    debugging = debugging.setZone(userTz);
    console.log(
      ">>>>>>>>>>>>>>> DateTime.fromISO(calendarEvent.start.dateTime) with zone",
      debugging
    );
    console.log(">>>>>>>>>>>>>>> DEBUGGING IANA Zone", debugging.toFormat("z"));
    debugging = debugging.toFormat("h:mm a ZZZZ");
    console.log(
      ">>>>>>>>>>>>>>> DateTime.fromISO(calendarEvent.start.dateTime).toFormat()",
      debugging
    );

    const notesTitle = `${calendarEvent.summary} - ${eventStartTime} - ${eventEndTime}`;

    let notesPermalink;

    if (user.notesStorage.current === "wrike") {
      const wrikeTask = {};
      wrikeTask.title = notesTitle;
      wrikeTask.description = `<h4><b>Attendees</b></h4><ul>`;
      wrikeTask.description += `<li><a href="mailto:${calendarEvent.organizer.email}">${calendarEvent.organizer.email}</a></li>`;
      if (calendarEvent.attendees) {
        calendarEvent.attendees.forEach((obj) => {
          wrikeTask.description += `<li><a href="mailto:${obj.email}">${obj.email}</a></li>`;
        });
      }
      wrikeTask.description += `</ul><h4><b>Meeting Notes</b></h4><ul><label><li></li></label></ul><h4><b>Action Items</b></h4><ul class='checklist' style='list-style-type: none;'><li><label><input type='checkbox' /></label></li></ul>`;
      wrikeTask.dates = {};
      wrikeTask.dates.type = "Planned";
      wrikeTask.dates.duration = DateTime.fromISO(calendarEvent.end.dateTime)
        .diff(DateTime.fromISO(calendarEvent.start.dateTime), "minutes")
        .toObject().minutes;
      wrikeTask.dates.start = DateTime.fromISO(calendarEvent.start.dateTime)
        .toISO({ includeOffset: false })
        .slice(0, -4);
      wrikeTask.dates.due = DateTime.fromISO(calendarEvent.end.dateTime)
        .toISO({ includeOffset: false })
        .slice(0, -4);

      wrikeTask.responsibles = [];

      let wrikeUserId = null;
      try {
        const wrikeUserIdResponse = await axios({
          method: "get",
          url: `https://${user.wrike.apiHost}/api/v4/contacts?me=true`,
          headers: {
            Authorization: `Bearer ${user.wrike.accessToken}`,
          },
        });
        if (wrikeUserIdResponse.status === 200) {
          wrikeUserId = wrikeUserIdResponse.data.data[0].id;
        }
        if (wrikeUserIdResponse.status !== 200) {
          calendarEvent = null;
        }
      } catch (err) {
        if (err.response && err.response.status === 401) {
          const tokenService = new TokenService();
          const userWithRefreshedToken = await tokenService.refreshToken(
            user,
            "WRIKE"
          );
          try {
            const wrikeUserIdResponse = await axios({
              method: "get",
              url: `https://${userWithRefreshedToken.wrike.apiHost}/api/v4/contacts?me=true`,
              headers: {
                Authorization: `Bearer ${userWithRefreshedToken.wrike.accessToken}`,
              },
            });
            if (wrikeUserIdResponse.status === 200) {
              wrikeUserId = wrikeUserIdResponse.data.data[0].id;
            }
            if (wrikeUserIdResponse.status !== 200) {
              calendarEvent = null;
            }
          } catch (err) {
            wrikeUserId = null;
          }
        } else {
          wrikeUserId = null;
        }
      }
      if (!wrikeUserId)
        return {
          error: true,
          message: "Failed to retrieve Wrike User ID",
        };
      wrikeTask.responsibles.push(wrikeUserId);

      let createdWrikeTask = null;
      try {
        const wrikeCreateTaskResponse = await axios({
          method: "post",
          url: `https://${user.wrike.apiHost}/api/v4/folders/${folderId}/tasks`,
          headers: {
            Authorization: `Bearer ${user.wrike.accessToken}`,
          },
          data: wrikeTask,
        });
        if (wrikeCreateTaskResponse.status === 200) {
          createdWrikeTask = wrikeCreateTaskResponse.data;
        }
        if (wrikeCreateTaskResponse.status !== 200) {
          createdWrikeTask = null;
        }
      } catch (err) {
        if (err.response && err.response.status === 401) {
          const tokenService = new TokenService();
          const userWithRefreshedToken = await tokenService.refreshToken(
            user,
            "WRIKE"
          );
          try {
            const wrikeCreateTaskResponse = await axios({
              method: "post",
              url: `https://${userWithRefreshedToken.wrike.apiHost}/api/v4/folders/${folderId}/tasks`,
              headers: {
                Authorization: `Bearer ${userWithRefreshedToken.wrike.accessToken}`,
              },
              data: wrikeTask,
            });
            if (wrikeCreateTaskResponse.status === 200) {
              createdWrikeTask = wrikeCreateTaskResponse.data;
            }
            if (wrikeCreateTaskResponse.status !== 200) {
              createdWrikeTask = null;
            }
          } catch (err) {
            createdWrikeTask = null;
          }
        } else {
          createdWrikeTask = null;
        }
      }
      if (!createdWrikeTask)
        return {
          error: true,
          message: "Failed to create Wrike task",
        };

      notesPermalink = createdWrikeTask.data[0].permalink;
    }

    if (user.notesStorage.current === "googleDrive") {
      // Create Google Doc w/ Title
      let googleDoc = {
        title: notesTitle,
      };

      // Save Google Doc and then move it to desired folder
      let savedGoogleDoc = null;
      try {
        const googleDocResponse = await axios({
          method: "post",
          url: "https://docs.googleapis.com/v1/documents",
          data: googleDoc,
          headers: {
            Authorization: `Bearer ${user.googleDrive.accessToken}`,
          },
        });
        if (googleDocResponse.status === 200) {
          savedGoogleDoc = googleDocResponse.data;
        }
        if (googleDocResponse.status !== 200) {
          savedGoogleDoc = null;
        }
      } catch (err) {
        if (err.response && err.response.status === 401) {
          const tokenService = new TokenService();
          const userWithRefreshedToken = await tokenService.refreshToken(
            user,
            "GOOGLE"
          );
          try {
            const googleDocResponse = await axios({
              method: "post",
              url: "https://docs.googleapis.com/v1/documents",
              data: googleDoc,
              headers: {
                Authorization: `Bearer ${userWithRefreshedToken.googleDrive.accessToken}`,
              },
            });
            if (googleDocResponse.status === 200) {
              savedGoogleDoc = googleDocResponse.data;
            }
            if (googleDocResponse.status !== 200) {
              savedGoogleDoc = null;
            }
          } catch (err) {
            savedGoogleDoc = null;
          }
        } else {
          savedGoogleDoc = null;
        }
      }

      if (!savedGoogleDoc)
        return {
          error: true,
          message: "Failed to create Google Doc",
        };

      let savedGoogleDocFileInfo = null;
      try {
        const googleDocFileInfoResponse = await axios({
          method: "get",
          url: `https://www.googleapis.com/drive/v3/files/${
            savedGoogleDoc.documentId
          }?fields=${encodeURIComponent("id, name, webViewLink, parents")}`,
          headers: {
            Authorization: `Bearer ${user.googleDrive.accessToken}`,
          },
        });
        if (googleDocFileInfoResponse.status === 200) {
          savedGoogleDocFileInfo = googleDocFileInfoResponse.data;
        }
        if (googleDocFileInfoResponse.status !== 200) {
          savedGoogleDocFileInfo = null;
        }
      } catch (err) {
        if (err.response && err.response.status === 401) {
          const tokenService = new TokenService();
          const userWithRefreshedToken = await tokenService.refreshToken(
            user,
            "GOOGLE",
            "DRIVE"
          );
          try {
            const googleDocFileInfoResponse = await axios({
              method: "get",
              url: `https://www.googleapis.com/drive/v3/files/${
                savedGoogleDoc.documentId
              }?fields=${encodeURIComponent("id, name, webViewLink, parents")}`,
              headers: {
                Authorization: `Bearer ${userWithRefreshedToken.googleDrive.accessToken}`,
              },
            });
            if (googleDocFileInfoResponse.status === 200) {
              savedGoogleDocFileInfo = googleDocFileInfoResponse.data;
            }
            if (googleDocFileInfoResponse.status !== 200) {
              savedGoogleDocFileInfo = null;
            }
          } catch (err) {
            savedGoogleDocFileInfo = null;
          }
        } else {
          savedGoogleDocFileInfo = null;
        }
      }

      if (!savedGoogleDocFileInfo)
        return {
          error: true,
          message:
            "Saved Google Doc, but failed to retrieve saved Google Doc file info",
        };

      notesPermalink = savedGoogleDocFileInfo.webViewLink;

      let movedGoogleDoc = null;
      try {
        const moveGoogleDocResponse = await axios({
          method: "patch",
          url: `https://www.googleapis.com/drive/v3/files/${savedGoogleDocFileInfo.id}?supportsAllDrives=true&removeParents=${savedGoogleDocFileInfo.parents[0]}&addParents=${folderId}`,
          headers: {
            Authorization: `Bearer ${user.googleDrive.accessToken}`,
          },
        });
        if (moveGoogleDocResponse.status === 200) {
          movedGoogleDoc = moveGoogleDocResponse.data;
        }
        if (moveGoogleDocResponse.status !== 200) {
          movedGoogleDoc = null;
        }
      } catch (err) {
        if (err.response && err.response.status === 401) {
          const tokenService = new TokenService();
          const userWithRefreshedToken = await tokenService.refreshToken(
            user,
            "GOOGLE",
            "DRIVE"
          );
          try {
            const moveGoogleDocResponse = await axios({
              method: "patch",
              url: `https://www.googleapis.com/drive/v3/files/${savedGoogleDocFileInfo.id}?supportsAllDrives=true&removeParents=${savedGoogleDocFileInfo.parents[0]}&addParents=${folderId}`,
              headers: {
                Authorization: `Bearer ${userWithRefreshedToken.googleDrive.accessToken}`,
              },
            });
            if (moveGoogleDocResponse.status === 200) {
              movedGoogleDoc = moveGoogleDocResponse.data;
            }
            if (moveGoogleDocResponse.status !== 200) {
              movedGoogleDoc = null;
            }
          } catch (err) {
            movedGoogleDoc = null;
          }
        } else {
          movedGoogleDoc = null;
        }
      }

      if (!movedGoogleDoc)
        return {
          error: true,
          message:
            "Saved Google Doc, but failed to move it into user selected folder",
        };
    }

    const googleNotesEventCreationData = {
      summary: "_Notes",
      description: notesPermalink,
      start: {
        dateTime: calendarEvent.start.dateTime,
      },
      end: {
        dateTime: calendarEvent.end.dateTime,
      },
      reminders: {
        useDefault: false,
      },
      colorId: "8",
    };

    let googleNotesEvent = null;
    try {
      const googleCreateNotesEventResponse = await axios({
        method: "post",
        url: `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
        headers: {
          Authorization: `Bearer ${user.google.accessToken}`,
        },
        data: googleNotesEventCreationData,
      });
      if (googleCreateNotesEventResponse.status === 200) {
        googleNotesEvent = googleCreateNotesEventResponse.data;
      }
      if (googleCreateNotesEventResponse.status !== 200) {
        googleNotesEvent = null;
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        const tokenService = new TokenService();
        const userWithRefreshedToken = await tokenService.refreshToken(
          user,
          "GOOGLE"
        );
        try {
          const googleCreateNotesEventResponse = await axios({
            method: "post",
            url: `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
            headers: {
              Authorization: `Bearer ${userWithRefreshedToken.google.accessToken}`,
            },
            data: googleNotesEventCreationData,
          });
          if (googleCreateNotesEventResponse.status === 200) {
            googleNotesEvent = googleCreateNotesEventResponse.data;
          }
          if (googleCreateNotesEventResponse.status !== 200) {
            googleNotesEvent = null;
          }
        } catch (err) {
          googleNotesEvent = null;
        }
      } else {
        googleNotesEvent = null;
      }
    }

    if (!googleNotesEvent)
      return {
        error: true,
        message:
          "Failed to create Google '_Notes' Event w/ Permalink to Notes File",
      };

    if (googleNotesEvent)
      return {
        success: true,
        message: "Created Google '_Notes' Event w/ Permalink to Notes File!",
      };
  }
}

module.exports = NotesService;
