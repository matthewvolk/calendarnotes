const UserModel = require("../models/User");
const DateService = require("./DateService");
const { DateTime } = require("luxon");
const axios = require("axios");

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

class UserService {
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
          logAxiosErrors(err);
        }
      } else {
        logAxiosErrors(err);
      }
    }

    return calendars;
  }

  async getNotesStorageInfo(user) {
    const userDoc = await UserModel.findOne({ "google.id": user.google.id });
    const { notesStorage: notesStorageInfo } = userDoc;
    return notesStorageInfo;
  }

  async updateNotesStorageInfo(user, notesStorageUpdate) {
    const userDoc = await UserModel.findOne({ "google.id": user.google.id });
    userDoc.notesStorage.current = notesStorageUpdate.current;
    await userDoc.save();
    return userDoc.notesStorage;
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
        let userWithRefreshedToken = await this.refreshToken(user, "GOOGLE");

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

  async listGoogleDrives(user, folderId) {
    if (!folderId) {
      // return top level drives
      try {
        const response = await axios({
          method: "get",
          url: "https://www.googleapis.com/drive/v3/drives",
          headers: {
            Authorization: `Bearer ${user.googleDrive.accessToken}`,
          },
        });

        if (response.data.nextPageToken) {
          console.log("Multi-page response");
        }

        if (!response.data.nextPageToken) {
          let driveResponse = response.data.drives.map((drive) => {
            return {
              id: drive.id,
              name: drive.name,
            };
          });
          driveResponse.push({
            id: "root",
            name: "My Drive",
            hasChildFolders: false,
          });
          const findIfHasChildFolders = await Promise.all(
            driveResponse.map((drive) => {
              let url = `https://www.googleapis.com/drive/v2/files/${
                drive.id
              }/children?q=${encodeURIComponent(
                "mimeType = 'application/vnd.google-apps.folder'"
              )}`;
              let promise = axios({
                method: "get",
                url,
                headers: {
                  Authorization: `Bearer ${user.googleDrive.accessToken}`,
                },
              });
              return promise;
            })
          );
          let folderHasChildren = findIfHasChildFolders.map(
            (promiseResponse) => {
              return promiseResponse.data.items.length >= 1 ? true : false;
            }
          );
          driveResponse = driveResponse.map((folder, index) => {
            return { ...folder, hasChildFolders: folderHasChildren[index] };
          });
          return driveResponse;
        }
      } catch (err) {
        if (err.response && err.response.status === 401) {
          let userWithRefreshedToken = await this.refreshToken(
            user,
            "GOOGLE",
            "DRIVE"
          );

          try {
            const response = await axios({
              method: "get",
              url: "https://www.googleapis.com/drive/v3/drives",
              headers: {
                Authorization: `Bearer ${userWithRefreshedToken.googleDrive.accessToken}`,
              },
            });

            if (response.data.nextPageToken) {
              console.log("Multi-page response");
            }

            if (!response.data.nextPageToken) {
              const driveResponse = response.data.drives.map((drive) => {
                return {
                  id: drive.id,
                  name: drive.name,
                };
              });
              driveResponse.push({
                id: "root",
                name: "My Drive",
                hasChildFolders: false,
              });
              const findIfHasChildFolders = await Promise.all(
                driveResponse.map((drive) => {
                  let url = `https://www.googleapis.com/drive/v2/files/${
                    drive.id
                  }/children?q=${encodeURIComponent(
                    "mimeType = 'application/vnd.google-apps.folder'"
                  )}`;
                  let promise = axios({
                    method: "get",
                    url,
                    headers: {
                      Authorization: `Bearer ${userWithRefreshedToken.googleDrive.accessToken}`,
                    },
                  });
                  return promise;
                })
              );
              let folderHasChildren = findIfHasChildFolders.map(
                (promiseResponse) => {
                  return promiseResponse.data.items.length >= 1 ? true : false;
                }
              );
              driveResponse = driveResponse.map((folder, index) => {
                return { ...folder, hasChildFolders: folderHasChildren[index] };
              });
              return driveResponse;
            }
          } catch (err) {
            logAxiosErrors(err);
          }
        }
        logAxiosErrors(err);
      }
    }

    if (folderId) {
      try {
        const response = await axios({
          method: "get",
          url: `https://www.googleapis.com/drive/v3/files?includeItemsFromAllDrives=true&supportsAllDrives=true&q=${encodeURIComponent(
            `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder'`
          )}`,
          headers: {
            Authorization: `Bearer ${user.googleDrive.accessToken}`,
          },
        });

        if (response.data.nextPageToken) {
          console.log("Multi-page response");
        }

        if (!response.data.nextPageToken) {
          let childFolders = response.data.files.map((file) => {
            return {
              id: file.id,
              name: file.name,
            };
          });
          const checkChildFoldersChildren = await Promise.all(
            childFolders.map((file) => {
              let url = `https://www.googleapis.com/drive/v2/files/${
                file.id
              }/children?q=${encodeURIComponent(
                "mimeType = 'application/vnd.google-apps.folder'"
              )}`;
              let promise = axios({
                method: "get",
                url,
                headers: {
                  Authorization: `Bearer ${user.googleDrive.accessToken}`,
                },
              });
              return promise;
            })
          );

          let folderHasChildren = checkChildFoldersChildren.map(
            (promiseResponse) => {
              return promiseResponse.data.items.length >= 1 ? true : false;
            }
          );
          childFolders = childFolders.map((folder, index) => {
            return { ...folder, hasChildFolders: folderHasChildren[index] };
          });
          return childFolders;
        }
      } catch (err) {
        if (err.response && err.response.status === 401) {
          let userWithRefreshedToken = await this.refreshToken(
            user,
            "GOOGLE",
            "DRIVE"
          );

          try {
            const response = await axios({
              method: "get",
              url: `https://www.googleapis.com/drive/v3/files?includeItemsFromAllDrives=true&supportsAllDrives=true&q=${encodeURIComponent(
                `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder'`
              )}`,
              headers: {
                Authorization: `Bearer ${userWithRefreshedToken.googleDrive.accessToken}`,
              },
            });

            if (response.data.nextPageToken) {
              console.log("Multi-page response");
            }

            if (!response.data.nextPageToken) {
              let childFolders = response.data.files.map((file) => {
                return {
                  id: file.id,
                  name: file.name,
                };
              });
              const checkChildFoldersChildren = await Promise.all(
                childFolders.map((file) => {
                  let url = `https://www.googleapis.com/drive/v2/files/${
                    file.id
                  }/children?q=${encodeURIComponent(
                    "mimeType = 'application/vnd.google-apps.folder'"
                  )}`;
                  let promise = axios({
                    method: "get",
                    url,
                    headers: {
                      Authorization: `Bearer ${userWithRefreshedToken.googleDrive.accessToken}`,
                    },
                  });
                  return promise;
                })
              );

              let folderHasChildren = checkChildFoldersChildren.map(
                (promiseResponse) => {
                  return promiseResponse.data.items.length >= 1 ? true : false;
                }
              );
              childFolders = childFolders.map((folder, index) => {
                return { ...folder, hasChildFolders: folderHasChildren[index] };
              });
              return childFolders;
            }
          } catch (err) {
            logAxiosErrors(err);
          }
        } else {
          logAxiosErrors(err);
        }
      }
    }
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
          let userWithRefreshedToken = await this.refreshToken(user, "GOOGLE");

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
        ).toFormat("t")}`,
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
          let userWithRefreshedToken = await this.refreshToken(user, "GOOGLE");
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
          let userWithRefreshedToken = await this.refreshToken(
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
          let userWithRefreshedToken = await this.refreshToken(
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

  async refreshToken(user, provider, resource = "AUTH") {
    if (!provider) {
      return new RangeError(
        "Paramater 'provider' must be provided as a string and equal to either 'GOOGLE' or 'WRIKE'"
      );
    }

    let googleRefreshToken = null;

    if (resource === "AUTH") {
      googleRefreshToken = user.google.refreshToken;
    }
    if (resource === "DRIVE") {
      googleRefreshToken = user.googleDrive.refreshToken;
    }

    const urls = {
      GOOGLE: `https://oauth2.googleapis.com/token?client_id=${process.env.GOOGLE_OAUTH2_CLIENT_ID}&client_secret=${process.env.GOOGLE_OAUTH2_CLIENT_SECRET}&grant_type=refresh_token&refresh_token=${googleRefreshToken}`,
      WRIKE: `https://${user.wrike.apiHost}/oauth2/token?client_id=${process.env.WRIKE_OAUTH2_CLIENT_ID}&client_secret=${process.env.WRIKE_OAUTH2_CLIENT_SECRET}&grant_type=refresh_token&refresh_token=${user.wrike.refreshToken}`,
    };

    try {
      const response = await axios({
        method: "post",
        url: urls[provider],
      });

      let userWithRefreshedToken = null;

      if (provider === "GOOGLE" && resource === "AUTH") {
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
      }

      if (provider === "GOOGLE" && resource === "DRIVE") {
        userWithRefreshedToken = await UserModel.findOneAndUpdate(
          { "google.id": user.google.id },
          {
            "googleDrive.accessToken": response.data.access_token,
            "googleDrive.expiresIn": response.data.expires_in,
            "googleDrive.scope": response.data.scope,
            "googleDrive.tokenType": response.data.token_type,
          },
          { new: true }
        ).exec();
      }

      if (provider === "WRIKE") {
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
      }

      return userWithRefreshedToken;
    } catch (err) {
      console.error("Problem in refreshToken()", err);
    }
  }
}

module.exports = UserService;
