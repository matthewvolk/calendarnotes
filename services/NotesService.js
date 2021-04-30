const axios = require("axios");
const { DateTime } = require("luxon");
const TokenService = require("./TokenService");

class NotesService {
  async createNotesForEvent(user, folderId, eventId, calendarId) {
    // Can we assume user.notesStorage.current will always be in sync b/t client/server?
    if (user.notesStorage.current === "wrike") {
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
          const tokenService = new TokenService();
          const userWithRefreshedToken = await tokenService.refreshToken(
            user,
            "GOOGLE"
          );

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

      let isoStartDateTime = DateTime.fromISO(
        eventResponse.data.start.dateTime
      ).toFormat("cccc, LLLL d ⋅ h:mm a");
      let isoEndDateTime = DateTime.fromISO(
        eventResponse.data.end.dateTime
      ).toFormat("h:mm a ZZZZ");

      let wrikeBody = {};
      wrikeBody.title = `${eventResponse.data.summary} - ${isoStartDateTime} - ${isoEndDateTime}`;
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
      wrikeBody.dates.duration = DateTime.fromISO(
        eventResponse.data.end.dateTime
      )
        .diff(DateTime.fromISO(eventResponse.data.start.dateTime), "minutes")
        .toObject().minutes;
      wrikeBody.dates.start = DateTime.fromISO(
        eventResponse.data.start.dateTime
      )
        .toISO({ includeOffset: false })
        .slice(0, -4);
      wrikeBody.dates.due = DateTime.fromISO(eventResponse.data.end.dateTime)
        .toISO({ includeOffset: false })
        .slice(0, -4);

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
          const tokenService = new TokenService();
          const userWithRefreshedToken = await tokenService.refreshToken(
            user,
            "WRIKE"
          );

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
          const tokenService = new TokenService();
          const userWithRefreshedToken = await tokenService.refreshToken(
            user,
            "WRIKE"
          );

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
          const tokenService = new TokenService();
          const userWithRefreshedToken = await tokenService.refreshToken(
            user,
            "GOOGLE"
          );

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

    if (user.notesStorage.current === "googleDrive") {
      // Get Google Calendar Event
      let eventResponse = null;
      let eventData = null;
      try {
        eventResponse = await axios({
          method: "get",
          url: `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
          headers: {
            Authorization: `Bearer ${user.google.accessToken}`,
          },
        });
        eventData = {
          title: eventResponse.data.summary,
          start: eventResponse.data.start,
          end: eventResponse.data.end,
          attendees: eventResponse.data.attendees,
          organizer: eventResponse.data.organizer,
        };
      } catch (err) {
        if (err.response && err.response.status === 401) {
          const tokenService = new TokenService();
          const userWithRefreshedToken = await tokenService.refreshToken(
            user,
            "GOOGLE"
          );

          try {
            eventResponse = await axios({
              method: "get",
              url: `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
              headers: {
                Authorization: `Bearer ${userWithRefreshedToken.google.accessToken}`,
              },
            });
            eventData = {
              title: eventResponse.data.summary,
              start: eventResponse.data.start,
              end: eventResponse.data.end,
              attendees: eventResponse.data.attendees,
              organizer: eventResponse.data.organizer,
            };
          } catch (err) {
            console.error("createNotesForEvent() failed twice");
          }
        } else {
          console.error("createNotesForEvent() failed twice");
        }
      }

      // Create Google Doc and fill it out with Calendar Event info
      let googleDoc = {
        title: `${eventData.title} - ${DateTime.fromISO(
          eventData.start.dateTime,
          { setZone: true }
        ).toFormat("cccc, LLLL d ⋅ t")} - ${DateTime.fromISO(
          eventData.end.dateTime,
          { setZone: true }
        ).toFormat("t ZZZZ")}`,
      };

      // Save Google Doc to folderId
      let googleDocResponse;
      try {
        googleDocResponse = await axios({
          method: "post",
          url: "https://docs.googleapis.com/v1/documents",
          data: googleDoc,
          headers: {
            Authorization: `Bearer ${user.googleDrive.accessToken}`,
          },
        });
      } catch (err) {
        if (err.response && err.response.status === 401) {
          const tokenService = new TokenService();
          const userWithRefreshedToken = await tokenService.refreshToken(
            user,
            "GOOGLE"
          );
          try {
            googleDocResponse = await axios({
              method: "post",
              url: "https://docs.googleapis.com/v1/documents",
              data: googleDoc,
              headers: {
                Authorization: `Bearer ${userWithRefreshedToken.googleDrive.accessToken}`,
              },
            });
          } catch (err) {
            logAxiosErrors(err);
          }
        } else {
          logAxiosErrors(err);
        }
      }

      const docId = googleDocResponse.data.documentId;

      let googleDocFileInfoResponse;
      try {
        googleDocFileInfoResponse = await axios({
          method: "get",
          url: `https://www.googleapis.com/drive/v3/files/${docId}?fields=${encodeURIComponent(
            "id, name, webViewLink, parents"
          )}`,
          headers: {
            Authorization: `Bearer ${user.googleDrive.accessToken}`,
          },
        });
      } catch (err) {
        if (err.response && err.response.status === 401) {
          const tokenService = new TokenService();
          const userWithRefreshedToken = await tokenService.refreshToken(
            user,
            "GOOGLE",
            "DRIVE"
          );

          try {
            googleDocFileInfoResponse = await axios({
              method: "get",
              url: `https://www.googleapis.com/drive/v3/files/${docId}?fields=${encodeURIComponent(
                "id, name, webViewLink, parents"
              )}`,
              headers: {
                Authorization: `Bearer ${userWithRefreshedToken.googleDrive.accessToken}`,
              },
            });
          } catch (err) {
            logAxiosErrors(err);
          }
        } else {
          logAxiosErrors(err);
        }
      }

      const googleDocFileInfo = googleDocFileInfoResponse.data;
      const parents = googleDocFileInfoResponse.data.parents;

      let moveGoogleDocResponse;
      try {
        moveGoogleDocResponse = await axios({
          method: "patch",
          url: `https://www.googleapis.com/drive/v3/files/${googleDocFileInfo.id}?supportsAllDrives=true&removeParents=${parents[0]}&addParents=${folderId}`,
          headers: {
            Authorization: `Bearer ${user.googleDrive.accessToken}`,
          },
        });
      } catch (err) {
        if (err.response && err.response.status === 401) {
          const tokenService = new TokenService();
          const userWithRefreshedToken = await tokenService.refreshToken(
            user,
            "GOOGLE",
            "DRIVE"
          );

          try {
            moveGoogleDocResponse = await axios({
              method: "patch",
              url: `https://www.googleapis.com/drive/v3/files/${googleDocFileInfo.id}?supportsAllDrives=true&removeParents=${parents[0]}&addParents=${folderId}`,
              headers: {
                Authorization: `Bearer ${userWithRefreshedToken.googleDrive.accessToken}`,
              },
            });
          } catch (err) {
            logAxiosErrors(err);
          }
        } else {
          logAxiosErrors(err);
        }
      }

      // Update Google Doc Body
      // let googleDocContentRequests = [];
      // googleDocContentRequests.push({
      //   insertText: {
      //     text: "Attendees:",
      //     location: {
      //       index: 1,
      //     },
      //   },
      // });
      // googleDocContentRequests.push({
      //   updateParagraphStyle: {
      //     range: {
      //       startIndex: 1,
      //       endIndex: 12,
      //     },
      //     paragraphStyle: {
      //       namedStyleType: "HEADING_1",
      //     },
      //     fields: "*",
      //   },
      // });
      // googleDocContentRequests.push({
      //   insertSectionBreak: {
      //     sectionType: "CONTINUOUS",
      //     location: {
      //       index: 11,
      //     },
      //   },
      // });
      // googleDocContentRequests.push({
      //   updateParagraphStyle: {
      //     fields: "*",
      //     range: {
      //       startIndex: 13,
      //       endIndex: 14,
      //     },
      //     paragraphStyle: {
      //       namedStyleType: "NORMAL_TEXT",
      //     },
      //   },
      // });
      // googleDocContentRequests.push({
      //   insertText: {
      //     text: `${eventData.organizer.email}\n`,
      //     location: {
      //       index: 13,
      //     },
      //   },
      // });
      // let organizerEmailEndIndex =
      //   eventData.organizer.email.length + 13 + 2 + 1;
      // googleDocContentRequests.push({
      //   updateTextStyle: {
      //     fields: "*",
      //     range: {
      //       startIndex: 13,
      //       endIndex: organizerEmailEndIndex,
      //     },
      //     textStyle: {
      //       link: {
      //         url: `mailto:${eventData.organizer.email}`,
      //       },
      //       foregroundColor: {
      //         color: {
      //           rgbColor: {
      //             red: 0,
      //             green: 0.47,
      //             blue: 0.81,
      //           },
      //         },
      //       },
      //       underline: true,
      //     },
      //   },
      // });
      // googleDocContentRequests.push({
      //   createParagraphBullets: {
      //     bulletPreset: "BULLET_DISC_CIRCLE_SQUARE",
      //     range: {
      //       startIndex: 13,
      //       endIndex: organizerEmailEndIndex,
      //     },
      //   },
      // });

      // googleDocContentRequests.push({
      //   insertText: {
      //     text: `${eventData.attendees[0].email}\n`,
      //     location: {
      //       index: organizerEmailEndIndex - 1,
      //     },
      //   },
      // });

      // let googleDocContentResponse;
      // try {
      //   googleDocContentResponse = await axios({
      //     method: "post",
      //     url: `https://docs.googleapis.com/v1/documents/${googleDocFileInfo.id}:batchUpdate`,
      //     data: {
      //       requests: googleDocContentRequests,
      //     },
      //     headers: {
      //       Authorization: `Bearer ${user.googleDrive.accessToken}`,
      //     },
      //   });
      // } catch (err) {
      //   if (err.response && err.response.status === 401) {
      //     let userWithRefreshedToken = await this.refreshToken(
      //       user,
      //       "GOOGLE",
      //       "DRIVE"
      //     );
      //     try {
      //       googleDocContentResponse = await axios({
      //         method: "post",
      //         url: `https://docs.googleapis.com/v1/documents/${googleDocFileInfo.id}:batchUpdate`,
      //         data: {
      //           requests: googleDocContentRequests,
      //         },
      //         headers: {
      //           Authorization: `Bearer ${userWithRefreshedToken.googleDrive.accessToken}`,
      //         },
      //       });
      //     } catch (err) {
      //       logAxiosErrors(err);
      //     }
      //   } else {
      //     logAxiosErrors(err);
      //   }
      // }

      // console.log(googleDocContentResponse);

      // Create Google Calendar _Notes event
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
            description: googleDocFileInfo.webViewLink,
            start: {
              dateTime: eventData.start.dateTime,
            },
            end: {
              dateTime: eventData.end.dateTime,
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
          const tokenService = new TokenService();
          const userWithRefreshedToken = await tokenService.refreshToken(
            user,
            "GOOGLE"
          );

          try {
            googleEventCreationResponse = await axios({
              method: "post",
              url: `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
              headers: {
                Authorization: `Bearer ${userWithRefreshedToken.google.accessToken}`,
              },
              data: {
                summary: "_Notes",
                description: googleDocFileInfo.webViewLink,
                start: {
                  dateTime: eventData.start.dateTime,
                },
                end: {
                  dateTime: eventData.end.dateTime,
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
  }
}

module.exports = NotesService;
