const jwt = require("jsonwebtoken");
const axios = require("axios");
const { DateTime } = require("luxon");
const User = require("../models/User");
const DateService = require("../services/DateService");
const TokenService = require("../services/TokenService");

module.exports = {
  googleAuth: (_, response) => {
    response.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?scope=${encodeURIComponent(
        "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile"
      )}&access_type=offline&prompt=consent&include_granted_scopes=true&response_type=code&redirect_uri=${encodeURIComponent(
        process.env.GOOGLE_OAUTH2_REDIRECT_URI_NEXT
      )}&client_id=${encodeURIComponent(process.env.GOOGLE_OAUTH2_CLIENT_ID)}`
    );
  },

  googleAuthCallback: async (request, response) => {
    const { error, code } = request.query;
    if (code) {
      const { data: tokens } = await axios({
        method: "post",
        url: `https://oauth2.googleapis.com/token?code=${code}&client_id=${encodeURIComponent(
          process.env.GOOGLE_OAUTH2_CLIENT_ID
        )}&client_secret=${encodeURIComponent(
          process.env.GOOGLE_OAUTH2_CLIENT_SECRET
        )}&redirect_uri=${encodeURIComponent(
          process.env.GOOGLE_OAUTH2_REDIRECT_URI_NEXT
        )}&grant_type=authorization_code`,
      });
      const { data: googleUser } = await axios({
        method: "get",
        url: "https://www.googleapis.com/oauth2/v1/userinfo",
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });
      const user = await User.findOne({ id: googleUser.id }).exec();
      if (!user) {
        const newUser = new User({
          id: googleUser.id,
          name: googleUser.name,
          email: googleUser.email,
          picture: googleUser.picture,
          givenName: googleUser.given_name,
          familyName: googleUser.family_name,
          "googleCalendar.accessToken": tokens.access_token,
          "googleCalendar.refreshToken": tokens.refresh_token,
          "googleCalendar.expiresIn": tokens.expires_in,
          "googleCalendar.scope": tokens.scope,
          "googleCalendar.tokenType": tokens.token_type,
          "googleCalendar.defaultCalId": googleUser.email,
        });
        await newUser.save();
      }
      if (user) {
        console.log(user.googleCalendar.scope);
        user.googleCalendar.accessToken = tokens.access_token;
        user.googleCalendar.refreshToken = tokens.refresh_token;
        user.googleCalendar.expiresIn = tokens.expires_in;
        user.googleCalendar.scope = tokens.scope;
        user.googleCalendar.tokenType = tokens.token_type;
        user.googleCalendar.defaultCalId = googleUser.email;
        console.log(user.googleCalendar.scope);
        await user.save();
      }
      const token = jwt.sign({ id: googleUser.id }, process.env.JWT_SECRET);
      response.redirect(
        `${process.env.GOOGLE_OAUTH_REDIRECT_NEXT}?token=${encodeURIComponent(
          token
        )}`
      );
    }
    if (error) {
      console.error(error);
    }
  },

  googleUser: (request, response) => {
    response.json(request.user);
    return;
  },

  googleCalendars: async (request, response) => {
    const user = request.user;
    try {
      const res = await axios({
        method: "get",
        url: `https://www.googleapis.com/calendar/v3/users/me/calendarList`,
        headers: {
          Authorization: `Bearer ${user.googleCalendar.accessToken}`,
        },
      });
      if (res.status === 200) {
        response.json(res.data.items);
      }
      if (res.status !== 200) {
        console.log("Call to get calendars not 200 OK");
        response.json(null);
      }
      return;
    } catch (err) {
      if (err.response && err.response.status === 401) {
        const tokenService = new TokenService();
        const userWithRefreshedToken = await tokenService.refreshTokenNext(
          user,
          "GOOGLE"
        );

        try {
          const res = await axios({
            method: "get",
            url: `https://www.googleapis.com/calendar/v3/users/me/calendarList`,
            headers: {
              Authorization: `Bearer ${userWithRefreshedToken.googleCalendar.accessToken}`,
            },
          });
          if (res.status === 200) {
            response.json(res.data.items);
          }
          if (res.status !== 200) {
            response.json(null);
          }
        } catch (err) {
          response.json(null);
        }
      } else {
        response.json(null);
      }
    }
  },

  googleEvents: async (request, response) => {
    const user = request.user;
    const dateServiceInstance = new DateService();

    let { id: calendarId, weekOf, prevOrNext } = request.query;
    let calendarTimeZone = null;

    if (weekOf) {
      if (!prevOrNext) {
        response
          .status(400)
          .send("Must provide query param prevOrNext if weekOf is specified");
      }

      if (["next", "prev"].indexOf(prevOrNext) === -1) {
        response.status(400).send("prevOrNext must be one of 'prev' or 'next'");
      }

      if (prevOrNext === "prev") {
        weekOf = dateServiceInstance.oneWeekBack(weekOf);
      }

      if (prevOrNext === "next") {
        weekOf = dateServiceInstance.oneWeekForward(weekOf);
      }
    }

    // Get user's Google Calendar Timezone
    try {
      const res = await axios({
        method: "get",
        url: `https://www.googleapis.com/calendar/v3/calendars/${calendarId}`,
        headers: {
          Authorization: `Bearer ${user.googleCalendar.accessToken}`,
        },
      });
      if (res.status === 200) {
        calendarTimeZone = res.data.timeZone;
      }
      if (res.status !== 200) {
        calendarTimeZone = null;
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        const tokenService = new TokenService();
        const userWithRefreshedToken = await tokenService.refreshTokenNext(
          user,
          "GOOGLE"
        );

        try {
          const res = await axios({
            method: "get",
            url: `https://www.googleapis.com/calendar/v3/calendars/${calendarId}`,
            headers: {
              Authorization: `Bearer ${userWithRefreshedToken.googleCalendar.accessToken}`,
            },
          });
          if (res.status === 200) {
            calendarTimeZone = res.data.timeZone;
          }
          if (res.status !== 200) {
            calendarTimeZone = null;
          }
        } catch (err) {
          calendarTimeZone = null;
        }
      } else {
        calendarTimeZone = null;
      }
    }

    if (!calendarTimeZone) {
      return response.json({
        error: true,
        message: "Failed to retrieve user calendar timezone",
        didNotProvideConsent: true,
      });
    }

    if (!weekOf) {
      weekOf = dateServiceInstance.getDateTimeForTimezone(calendarTimeZone);
    }

    let { startOfWeek, endOfWeek } =
      dateServiceInstance.getWeekStartAndEndForDate(weekOf);

    let userFriendlyStartOfWeek =
      dateServiceInstance.getUserFriendlyStartOfWeek(weekOf);

    url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events?timeMin=${encodeURIComponent(
      startOfWeek
    )}&timeMax=${encodeURIComponent(endOfWeek)}&singleEvents=true`;

    try {
      const res = await axios({
        method: "get",
        url,
        headers: {
          Authorization: `Bearer ${user.googleCalendar.accessToken}`,
        },
      });
      if (res.status === 200) {
        response.json({
          startOfWeekISO: startOfWeek,
          startOfWeek: userFriendlyStartOfWeek,
          events: res.data.items
            .filter((obj) => obj.start)
            .sort((a, b) => {
              return (
                new Date(a.start.dateTime).getTime() -
                new Date(b.start.dateTime).getTime()
              );
            }),
        });
      }
      if (res.status !== 200) {
        console.log("Call to get calendars not 200 OK");
        response.json(null);
      }
      return;
    } catch (err) {
      if (err.response && err.response.status === 401) {
        const tokenService = new TokenService();
        const userWithRefreshedToken = await tokenService.refreshTokenNext(
          user,
          "GOOGLE"
        );

        try {
          const res = await axios({
            method: "get",
            url,
            headers: {
              Authorization: `Bearer ${userWithRefreshedToken.googleCalendar.accessToken}`,
            },
          });
          if (res.status === 200) {
            response.json({
              startOfWeekISO: startOfWeek,
              startOfWeek: userFriendlyStartOfWeek,
              events: res.data.items
                .filter((obj) => obj.start)
                .sort((a, b) => {
                  return (
                    new Date(a.start.dateTime).getTime() -
                    new Date(b.start.dateTime).getTime()
                  );
                }),
            });
          }
          if (res.status !== 200) {
            response.json(null);
          }
        } catch (err) {
          response.json(null);
        }
      } else {
        response.json(null);
      }
    }
  },

  defaultCalendar: async (request, response) => {
    const user = request.user;
    const { id: calendarId } = request.body;
    user.googleCalendar.defaultCalId = calendarId;
    await user.save();
    response.json(user.googleCalendar.defaultCalId);
  },

  notesStorage: async (request, response) => {
    const { location } = request.query;
    const user = request.user;

    const userDoc = await User.findOne({ id: user.id });

    if (location === "googleDrive") {
      userDoc.notesStorage.current = "googleDrive";
      await userDoc.save();
      response.json({ status: 200, message: "success" });
    }
    if (location === "googleDriveSafe") {
      userDoc.notesStorage.current = "googleDriveSafe";
      await userDoc.save();
      response.json({ status: 200, message: "success" });
    }
    if (location === "wrike") {
      userDoc.notesStorage.current = "wrike";
      await userDoc.save();
      response.json({ status: 200, message: "success" });
    }
  },

  getFolders: async (request, response) => {
    const { location, folderId } = request.query;
    const user = request.user;

    if (location === "googleDriveSafe") {
      response.json([
        {
          id: user.googleDriveSafe.folderId,
          name: "CalendarNotes",
          hasChildFolders: false,
        },
      ]);
    }

    if (location === "googleDrive") {
      if (!folderId) {
        // return top level drives
        try {
          const res = await axios({
            method: "get",
            url: "https://www.googleapis.com/drive/v3/drives",
            headers: {
              Authorization: `Bearer ${user.googleDrive.accessToken}`,
            },
          });

          if (res.data.nextPageToken) {
            console.log("Multi-page response");
          }

          if (!res.data.nextPageToken) {
            let driveResponse = res.data.drives.map((drive) => {
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
            response.json(driveResponse);
          }
        } catch (err) {
          if (err.response && err.response.status === 401) {
            const tokenService = new TokenService();
            const userWithRefreshedToken = await tokenService.refreshTokenNext(
              user,
              "GOOGLE",
              "DRIVE"
            );

            try {
              const res = await axios({
                method: "get",
                url: "https://www.googleapis.com/drive/v3/drives",
                headers: {
                  Authorization: `Bearer ${userWithRefreshedToken.googleDrive.accessToken}`,
                },
              });

              if (res.data.nextPageToken) {
                console.log("Multi-page response");
              }

              if (!res.data.nextPageToken) {
                let driveResponse = res.data.drives.map((drive) => {
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
                    return promiseResponse.data.items.length >= 1
                      ? true
                      : false;
                  }
                );
                driveResponse = driveResponse.map((folder, index) => {
                  return {
                    ...folder,
                    hasChildFolders: folderHasChildren[index],
                  };
                });
                response.json(driveResponse);
              }
            } catch (err) {
              response.json(null);
            }
          } else {
            response.json(null);
          }
        }
      }

      if (folderId) {
        try {
          const res = await axios({
            method: "get",
            url: `https://www.googleapis.com/drive/v3/files?includeItemsFromAllDrives=true&supportsAllDrives=true&q=${encodeURIComponent(
              `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder'`
            )}`,
            headers: {
              Authorization: `Bearer ${user.googleDrive.accessToken}`,
            },
          });

          if (res.data.nextPageToken) {
            console.log("Multi-page response");
          }

          if (!res.data.nextPageToken) {
            let childFolders = res.data.files.map((file) => {
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
            response.json(childFolders);
          }
        } catch (err) {
          if (err.response && err.response.status === 401) {
            const tokenService = new TokenService();
            const userWithRefreshedToken = await tokenService.refreshTokenNext(
              user,
              "GOOGLE",
              "DRIVE"
            );

            try {
              const res = await axios({
                method: "get",
                url: `https://www.googleapis.com/drive/v3/files?includeItemsFromAllDrives=true&supportsAllDrives=true&q=${encodeURIComponent(
                  `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder'`
                )}`,
                headers: {
                  Authorization: `Bearer ${userWithRefreshedToken.googleDrive.accessToken}`,
                },
              });

              if (res.data.nextPageToken) {
                console.log("Multi-page response");
              }

              if (!res.data.nextPageToken) {
                let childFolders = res.data.files.map((file) => {
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
                    return promiseResponse.data.items.length >= 1
                      ? true
                      : false;
                  }
                );
                childFolders = childFolders.map((folder, index) => {
                  return {
                    ...folder,
                    hasChildFolders: folderHasChildren[index],
                  };
                });
                response.json(childFolders);
              }
            } catch (err) {
              response.json(null);
            }
          } else {
            response.json(null);
          }
        }
      }
    }

    if (location === "wrike") {
      if (!folderId) {
        let folderResponse = null;
        try {
          const res = await axios({
            method: "get",
            url: `https://${user.wrike.apiHost}/api/v4/spaces`,
            headers: {
              Authorization: `Bearer ${user.wrike.accessToken}`,
            },
          });
          folderResponse = { spaces: res.data };
        } catch (err) {
          if (err.response && err.response.status === 401) {
            const tokenService = new TokenService();
            const userWithRefreshedToken = await tokenService.refreshTokenNext(
              user,
              "WRIKE"
            );

            try {
              const res = await axios({
                method: "get",
                url: `https://${userWithRefreshedToken.wrike.apiHost}/api/v4/spaces`,
                headers: {
                  Authorization: `Bearer ${userWithRefreshedToken.wrike.accessToken}`,
                },
              });
              folderResponse = { spaces: res.data };
            } catch (err) {
              folderResponse = null;
            }
          } else {
            folderResponse = null;
          }
        }

        if (folderResponse) {
          // refresh wrike token just in case its about to expire before Promise.all (if one promise fails, they all fail)
          const tokenService = new TokenService();
          const userWithRefreshedToken = await tokenService.refreshTokenNext(
            user,
            "WRIKE"
          );

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

        response.json(folderResponse);
      }

      if (folderId) {
        let folderResponse = null;
        try {
          const res = await axios({
            method: "get",
            url: `https://${user.wrike.apiHost}/api/v4/folders/${folderId}/folders`,
            headers: {
              Authorization: `Bearer ${user.wrike.accessToken}`,
            },
          });
          folderResponse = res.data.data[0].childIds;
        } catch (err) {
          if (err.response && err.response.status === 401) {
            const tokenService = new TokenService();
            const userWithRefreshedToken = await tokenService.refreshTokenNext(
              user,
              "WRIKE"
            );

            try {
              const res = await axios({
                method: "get",
                url: `https://${userWithRefreshedToken.wrike.apiHost}/api/v4/folders/${folderId}/folders`,
                headers: {
                  Authorization: `Bearer ${userWithRefreshedToken.wrike.accessToken}`,
                },
              });
              folderResponse = res.data.data[0].childIds;
            } catch (err) {
              folderResponse = null;
            }
          } else {
            folderResponse = null;
          }
        }

        if (folderResponse) {
          const tokenService = new TokenService();
          const userWithRefreshedToken = await tokenService.refreshTokenNext(
            user,
            "WRIKE"
          );

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
            response.json(folderResponse);
          } catch (err) {
            console.log("Promise.all() failed:", err);
            return { error: true };
          }
        }
      }
    }

    if (!location) {
      // user has not authenticated with a notes location
      response.json(null);
    }

    // response.json([
    //   {
    //     id: "test1",
    //     name: "Test 1",
    //     hasChildFolders: true,
    //     children: [
    //       {
    //         id: "subtest1",
    //         name: "Sub Test 1",
    //         hasChildFolders: true,
    //         children: [
    //           {
    //             id: "subsubtest1",
    //             name: "Sub Sub Test 1",
    //             hasChildFolders: false,
    //           },
    //         ],
    //       },
    //     ],
    //   },
    //   {
    //     id: "test2",
    //     name: "Test 2",
    //     hasChildFolders: true,
    //     children: [
    //       { id: "subtest1", name: "Sub Test 1", hasChildFolders: false },
    //     ],
    //   },
    //   {
    //     id: "test3",
    //     name: "Test 3",
    //     hasChildFolders: true,
    //     children: [
    //       { id: "subtest1", name: "Sub Test 1", hasChildFolders: false },
    //     ],
    //   },
    //   {
    //     id: "test4",
    //     name: "Test 4",
    //     hasChildFolders: true,
    //     children: [
    //       { id: "subtest1", name: "Sub Test 1", hasChildFolders: false },
    //     ],
    //   },
    // ]);
  },

  googleDriveAuthSafe: (request, response) => {
    const user = request.user;
    response.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?client_id=${
        process.env.GOOGLE_OAUTH2_CLIENT_ID
      }&redirect_uri=${encodeURIComponent(
        process.env.GOOGLE_DRIVE_SAFE_OAUTH_REDIRECT_URI_NEXT
      )}&response_type=code&scope=${encodeURIComponent(
        "https://www.googleapis.com/auth/drive.file"
      )}&access_type=offline&prompt=consent&state=${encodeURIComponent(
        `${user.id}`
      )}`
    );
  },

  googleDriveAuthCallbackSafe: async (request, response) => {
    const { error, code, state: id } = request.query;

    if (code) {
      const googleDriveCreds = await axios({
        method: "post",
        url: `https://oauth2.googleapis.com/token?client_id=${
          process.env.GOOGLE_OAUTH2_CLIENT_ID
        }&client_secret=${
          process.env.GOOGLE_OAUTH2_CLIENT_SECRET
        }&code=${code}&grant_type=authorization_code&redirect_uri=${encodeURIComponent(
          process.env.GOOGLE_DRIVE_SAFE_OAUTH_REDIRECT_URI_NEXT
        )}`,
      });
      const user = await User.findOne({ id });
      user.googleDriveSafe.accessToken = googleDriveCreds.data.access_token;
      user.googleDriveSafe.expiresIn = googleDriveCreds.data.expires_in;
      user.googleDriveSafe.refreshToken = googleDriveCreds.data.refresh_token;
      user.googleDriveSafe.scope = googleDriveCreds.data.scope;
      user.googleDriveSafe.tokenType = googleDriveCreds.data.token_type;
      user.notesStorage.current = "googleDriveSafe";
      user.notesStorage.available.push({
        id: "googleDriveSafe",
        name: "Google Drive Safe",
      });
      await user.save();
      console.log("Saved User with Google Drive Safe");
      console.log("Making API Call to Create CalendarNotes Folder");
      const calendarNotesFolderCreationResponse = await axios({
        method: "post",
        url: `https://www.googleapis.com/drive/v3/files`,
        headers: {
          // Refactor Mongo Save call above to return new user and use that below
          Authorization: `Bearer ${googleDriveCreds.data.access_token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        data: {
          name: "CalendarNotes",
          mimeType: "application/vnd.google-apps.folder",
        },
      });
      if (
        calendarNotesFolderCreationResponse.status <= 299 &&
        calendarNotesFolderCreationResponse.status >= 200
      ) {
        console.log("CalendarNotes folder created");
        const calendarNotesFolderId =
          calendarNotesFolderCreationResponse.data.id;
        const user = await User.findOne({ id });
        user.googleDriveSafe.folderId = calendarNotesFolderId;
        await user.save();
        console.log("Saved User with Google Drive Safe Folder ID");
      }
      response.redirect(process.env.GOOGLE_OAUTH_REDIRECT_NEXT);
    }

    if (error) {
      response.redirect(process.env.GOOGLE_OAUTH_REDIRECT_NEXT);
    }
  },

  googleDriveAuthCheck: async (request, response) => {
    try {
      const checkAuth = await axios({
        method: "get",
        url: `https://www.googleapis.com/drive/v3/files/${request.user.googleDriveSafe.folderId}`,
        headers: {
          Authorization: `Bearer ${request.user.googleDriveSafe.accessToken}`,
          Accept: "application/json",
        },
      });
      response.status(204).send();
    } catch (error) {
      if (error.response.status === 401) {
        const tokenService = new TokenService();
        const userWithRefreshedToken = await tokenService.refreshTokenNext(
          request.user,
          "GOOGLE",
          "DRIVE_SAFE"
        );
        try {
          const checkAuth = await axios({
            method: "get",
            url: `https://www.googleapis.com/drive/v3/files/${userWithRefreshedToken.googleDriveSafe.folderId}`,
            headers: {
              Authorization: `Bearer ${userWithRefreshedToken.googleDriveSafe.accessToken}`,
              Accept: "application/json",
            },
          });
          response.status(204).send();
        } catch (error) {
          const user = await User.findOne({ id: request.user.id });
          user.googleDriveSafe = undefined;
          user.notesStorage.current = undefined;
          user.notesStorage.available.pop();
          await user.save();
          console.log(user);
        }
      }
      response.status(200).send();
    }
  },

  wrikeAuth: (request, response) => {
    const user = request.user;
    response.redirect(
      `https://login.wrike.com/oauth2/authorize/v4?client_id=${
        process.env.WRIKE_OAUTH2_CLIENT_ID
      }&response_type=code&redirect_uri=${encodeURIComponent(
        process.env.WRIKE_OAUTH2_REDIRECT_URI_NEXT
      )}&state=${encodeURIComponent(`${user.id}`)}`
    );
  },

  wrikeAuthCallback: async (request, response) => {
    const { code, error, state: id } = request.query;

    if (code) {
      try {
        const wrikeResponse = await axios({
          method: "post",
          url: `https://login.wrike.com/oauth2/token?client_id=${
            process.env.WRIKE_OAUTH2_CLIENT_ID
          }&client_secret=${
            process.env.WRIKE_OAUTH2_CLIENT_SECRET
          }&grant_type=authorization_code&code=${
            request.query.code
          }&redirect_uri=${encodeURIComponent(
            process.env.WRIKE_OAUTH2_REDIRECT_URI_NEXT
          )}`,
        });
        const user = await User.findOne({ id });
        user.wrike.accessToken = wrikeResponse.data.access_token;
        user.wrike.refreshToken = wrikeResponse.data.refresh_token;
        user.wrike.apiHost = wrikeResponse.data.host;
        user.wrike.tokenType = wrikeResponse.data.token_type;
        user.wrike.expiresIn = wrikeResponse.data.expires_in;
        user.notesStorage.current = "wrike";
        user.notesStorage.available.push({ id: "wrike", name: "Wrike" });
        await user.save();
        response.redirect(process.env.WRIKE_OAUTH_REDIRECT_NEXT);
      } catch (err) {
        next(err);
      }
    }

    if (error) {
      response.redirect(process.env.WRIKE_OAUTH_REDIRECT_NEXT);
    }
  },

  createNotes: async (request, response) => {
    const user = request.user;
    const { eventId, folderId, calendarId } = request.body;

    let calendarEvent = null;
    try {
      const calendarEventResponse = await axios({
        method: "get",
        url: `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
        headers: {
          Authorization: `Bearer ${user.googleCalendar.accessToken}`,
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
        const userWithRefreshedToken = await tokenService.refreshTokenNext(
          user,
          "GOOGLE"
        );
        try {
          const calendarEventResponse = await axios({
            method: "get",
            url: `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
            headers: {
              Authorization: `Bearer ${userWithRefreshedToken.googleCalendar.accessToken}`,
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
      response.json({
        error: true,
        message: "Failed to retrieve Google Calendar Event",
      });

    let userTz;

    try {
      const res = await axios({
        method: "get",
        url: `https://www.googleapis.com/calendar/v3/calendars/${calendarId}`,
        headers: {
          Authorization: `Bearer ${user.googleCalendar.accessToken}`,
        },
      });
      if (res.status === 200) {
        userTz = res.data.timeZone;
      }
      if (res.status !== 200) {
        userTz = null;
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        const tokenService = new TokenService();
        const userWithRefreshedToken = await tokenService.refreshTokenNext(
          user,
          "GOOGLE"
        );

        try {
          const res = await axios({
            method: "get",
            url: `https://www.googleapis.com/calendar/v3/calendars/${calendarId}`,
            headers: {
              Authorization: `Bearer ${userWithRefreshedToken.googleCalendar.accessToken}`,
            },
          });
          if (res.status === 200) {
            userTz = res.data.timeZone;
          }
          if (res.status !== 200) {
            userTz = null;
          }
        } catch (err) {
          userTz = null;
        }
      } else {
        userTz = null;
      }
    }

    if (!userTz) {
      return response.json({
        error: true,
        message: "Failed to retrieve user calendar timezone",
        didNotProvideConsent: true,
      });
    }

    let eventStartTime = DateTime.fromISO(calendarEvent.start.dateTime);
    eventStartTime = eventStartTime.setZone(userTz);
    eventStartTime = eventStartTime.toFormat("cccc, LLLL d ⋅ h:mm a");

    let eventEndTime = DateTime.fromISO(calendarEvent.end.dateTime);
    eventEndTime = eventEndTime.setZone(userTz);
    eventEndTime = eventEndTime.toFormat("h:mm a ZZZZ");

    const notesTitle = `${calendarEvent.summary} - ${eventStartTime} - ${eventEndTime}`;

    let notesPermalink;

    if (user.notesStorage.current === "googleDriveSafe") {
      // Create Google Doc w/ Title
      let googleDoc = {
        title: notesTitle,
      };

      // Save Google Doc
      let savedGoogleDoc = null;
      try {
        const googleDocResponse = await axios({
          method: "post",
          url: "https://docs.googleapis.com/v1/documents",
          data: googleDoc,
          headers: {
            Authorization: `Bearer ${user.googleDriveSafe.accessToken}`,
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
          const userWithRefreshedToken = await tokenService.refreshTokenNext(
            user,
            "GOOGLE",
            "DRIVE_SAFE"
          );
          try {
            const googleDocResponse = await axios({
              method: "post",
              url: "https://docs.googleapis.com/v1/documents",
              data: googleDoc,
              headers: {
                Authorization: `Bearer ${userWithRefreshedToken.googleDriveSafe.accessToken}`,
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

      if (!savedGoogleDoc) {
        console.log({
          error: true,
          message: "Failed to create Google Doc",
        });
        return response.json({
          error: true,
          message: "Failed to create Google Doc",
        });
      }

      // Get Google Document ID and webViewLink
      let savedGoogleDocFileInfo = null;
      try {
        const googleDocFileInfoResponse = await axios({
          method: "get",
          url: `https://www.googleapis.com/drive/v3/files/${
            savedGoogleDoc.documentId
          }?fields=${encodeURIComponent("id, name, webViewLink")}`,
          headers: {
            Authorization: `Bearer ${user.googleDriveSafe.accessToken}`,
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
          const userWithRefreshedToken = await tokenService.refreshTokenNext(
            user,
            "GOOGLE",
            "DRIVE_SAFE"
          );
          try {
            const googleDocFileInfoResponse = await axios({
              method: "get",
              url: `https://www.googleapis.com/drive/v3/files/${
                savedGoogleDoc.documentId
              }?fields=${encodeURIComponent("id, name, webViewLink")}`,
              headers: {
                Authorization: `Bearer ${userWithRefreshedToken.googleDriveSafe.accessToken}`,
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

      if (!savedGoogleDocFileInfo) {
        console.log({
          error: true,
          message:
            "Saved Google Doc, but failed to retrieve saved Google Doc file info",
        });
        return response.json({
          error: true,
          message:
            "Saved Google Doc, but failed to retrieve saved Google Doc file info",
        });
      }

      notesPermalink = savedGoogleDocFileInfo.webViewLink;

      let calendarNotesFolderInfo = null;
      try {
        const calendarNotesFolderInfoResponse = await axios({
          method: "get",
          url: `https://www.googleapis.com/drive/v3/files/${
            user.googleDriveSafe.folderId
          }?fields=${encodeURIComponent("kind, id, name, mimeType, trashed")}`,
          headers: {
            Authorization: `Bearer ${user.googleDriveSafe.accessToken}`,
            Accept: "application/json",
          },
        });

        if (calendarNotesFolderInfoResponse.data.trashed == true) {
          console.log("folder was deleted, create a new one");
          try {
            const calendarNotesFolderCreationResponse = await axios({
              method: "post",
              url: `https://www.googleapis.com/drive/v3/files`,
              headers: {
                // Refactor Mongo Save call above to return new user and use that below
                Authorization: `Bearer ${user.googleDriveSafe.accessToken}`,
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              data: {
                name: "CalendarNotes",
                mimeType: "application/vnd.google-apps.folder",
              },
            });
            if (
              calendarNotesFolderCreationResponse.status <= 299 &&
              calendarNotesFolderCreationResponse.status >= 200
            ) {
              console.log(
                "CalendarNotes folder created because it was deleted"
              );
              const calendarNotesFolderId =
                calendarNotesFolderCreationResponse.data.id;
              const newUser = await User.findOne({ id: user.id });
              console.log("NEW USER", newUser);
              newUser.googleDriveSafe.folderId = calendarNotesFolderId;
              await newUser.save();
              console.log(
                "Saved User with Google Drive Safe Folder ID first try"
              );
              calendarNotesFolderInfo =
                calendarNotesFolderCreationResponse.data;
            }
          } catch (err) {
            if (err.response && err.response.status === 401) {
              const tokenService = new TokenService();
              const userWithRefreshedToken =
                await tokenService.refreshTokenNext(
                  user,
                  "GOOGLE",
                  "DRIVE_SAFE"
                );
              const calendarNotesFolderCreationResponse = await axios({
                method: "post",
                url: `https://www.googleapis.com/drive/v3/files`,
                headers: {
                  // Refactor Mongo Save call above to return new user and use that below
                  Authorization: `Bearer ${userWithRefreshedToken.googleDriveSafe.accessToken}`,
                  Accept: "application/json",
                  "Content-Type": "application/json",
                },
                data: {
                  name: "CalendarNotes",
                  mimeType: "application/vnd.google-apps.folder",
                },
              });
              if (
                calendarNotesFolderCreationResponse.status <= 299 &&
                calendarNotesFolderCreationResponse.status >= 200
              ) {
                console.log(
                  "CalendarNotes folder created because it was deleted"
                );
                const calendarNotesFolderId =
                  calendarNotesFolderCreationResponse.data.id;
                const newUser = await User.findOne({ id: user.id });
                console.log("NEW USER", newUser);
                newUser.googleDriveSafe.folderId = calendarNotesFolderId;
                await newUser.save();
                console.log(
                  "Saved User with Google Drive Safe Folder ID second try"
                );
                calendarNotesFolderInfo =
                  calendarNotesFolderCreationResponse.data;
              }
            }
          }
        }

        if (
          calendarNotesFolderInfoResponse.status === 200 &&
          calendarNotesFolderInfoResponse.data.trashed == false
        ) {
          calendarNotesFolderInfo = calendarNotesFolderInfoResponse.data;
          console.log(calendarNotesFolderInfo);
        }
      } catch (err) {
        if (err.response && err.response.status === 401) {
          const tokenService = new TokenService();
          const userWithRefreshedToken = await tokenService.refreshTokenNext(
            user,
            "GOOGLE",
            "DRIVE_SAFE"
          );

          const calendarNotesFolderInfoResponse = await axios({
            method: "get",
            url: `https://www.googleapis.com/drive/v3/files/${
              user.googleDriveSafe.folderId
            }?fields=${encodeURIComponent(
              "kind, id, name, mimeType, trashed"
            )}`,
            headers: {
              Authorization: `Bearer ${userWithRefreshedToken.googleDriveSafe.accessToken}`,
              Accept: "application/json",
            },
          });

          if (calendarNotesFolderInfoResponse.data.trashed == true) {
            // folder was deleted, create a new one
            try {
              const calendarNotesFolderCreationResponse = await axios({
                method: "post",
                url: `https://www.googleapis.com/drive/v3/files`,
                headers: {
                  // Refactor Mongo Save call above to return new user and use that below
                  Authorization: `Bearer ${userWithRefreshedToken.googleDriveSafe.accessToken}`,
                  Accept: "application/json",
                  "Content-Type": "application/json",
                },
                data: {
                  name: "CalendarNotes",
                  mimeType: "application/vnd.google-apps.folder",
                },
              });
              if (
                calendarNotesFolderCreationResponse.status <= 299 &&
                calendarNotesFolderCreationResponse.status >= 200
              ) {
                console.log(
                  "CalendarNotes folder created because it was deleted in 401 retry of calendarNotesFolderInfo"
                );
                const calendarNotesFolderId =
                  calendarNotesFolderCreationResponse.data.id;
                const newUser = await User.findOne({ id: user.id });
                console.log("NEW USER", newUser);
                newUser.googleDriveSafe.folderId = calendarNotesFolderId;
                await newUser.save();
                console.log(
                  "Saved User with Google Drive Safe Folder ID in 401 retry of calendarNotesFolderInfo"
                );
                calendarNotesFolderInfo =
                  calendarNotesFolderCreationResponse.data;
              }
            } catch (err) {
              console.log(
                "Failed to create CalendarNotes Folder in 401 retry of calendarNotesFolderInfo"
              );
            }
          }

          if (
            calendarNotesFolderInfoResponse.status === 200 &&
            calendarNotesFolderInfoResponse.data.trashed == false
          ) {
            calendarNotesFolderInfo = calendarNotesFolderInfoResponse.data;
          }
        }
        if (
          (err.response && err.response.status === 404) ||
          err.response.status === 400
        ) {
          console.log("cannot match folder id to folder, creating a new one");
          try {
            const calendarNotesFolderCreationResponse = await axios({
              method: "post",
              url: `https://www.googleapis.com/drive/v3/files`,
              headers: {
                // Refactor Mongo Save call above to return new user and use that below
                Authorization: `Bearer ${user.googleDriveSafe.accessToken}`,
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              data: {
                name: "CalendarNotes",
                mimeType: "application/vnd.google-apps.folder",
              },
            });
            if (
              calendarNotesFolderCreationResponse.status <= 299 &&
              calendarNotesFolderCreationResponse.status >= 200
            ) {
              console.log(
                "CalendarNotes folder created because it was deleted"
              );
              const calendarNotesFolderId =
                calendarNotesFolderCreationResponse.data.id;
              const newUser = await User.findOne({ id: user.id });
              console.log("NEW USER", newUser);
              newUser.googleDriveSafe.folderId = calendarNotesFolderId;
              await newUser.save();
              console.log(
                "Saved User with Google Drive Safe Folder ID first try"
              );
              calendarNotesFolderInfo =
                calendarNotesFolderCreationResponse.data;
            }
          } catch (err) {
            if (err.response && err.response.status === 401) {
              const tokenService = new TokenService();
              const userWithRefreshedToken =
                await tokenService.refreshTokenNext(
                  user,
                  "GOOGLE",
                  "DRIVE_SAFE"
                );
              const calendarNotesFolderCreationResponse = await axios({
                method: "post",
                url: `https://www.googleapis.com/drive/v3/files`,
                headers: {
                  // Refactor Mongo Save call above to return new user and use that below
                  Authorization: `Bearer ${userWithRefreshedToken.googleDriveSafe.accessToken}`,
                  Accept: "application/json",
                  "Content-Type": "application/json",
                },
                data: {
                  name: "CalendarNotes",
                  mimeType: "application/vnd.google-apps.folder",
                },
              });
              if (
                calendarNotesFolderCreationResponse.status <= 299 &&
                calendarNotesFolderCreationResponse.status >= 200
              ) {
                console.log(
                  "CalendarNotes folder created because it was deleted"
                );
                const calendarNotesFolderId =
                  calendarNotesFolderCreationResponse.data.id;
                const newUser = await User.findOne({ id: user.id });
                console.log("NEW USER", newUser);
                newUser.googleDriveSafe.folderId = calendarNotesFolderId;
                await newUser.save();
                console.log(
                  "Saved User with Google Drive Safe Folder ID second try"
                );
                calendarNotesFolderInfo =
                  calendarNotesFolderCreationResponse.data;
              }
            }
          }
        }
        console.log("Should not see");
      }

      if (!calendarNotesFolderInfo) {
        console.log({
          error: true,
          message:
            "Could not retrieve CalendarNotes Folder info to move Google Doc to",
        });
        return response.json({
          error: true,
          message:
            "Could not retrieve CalendarNotes Folder info to move Google Doc to",
        });
      }

      let movedGoogleDoc = null;
      try {
        const moveGoogleDocResponse = await axios({
          method: "patch",
          url: `https://www.googleapis.com/drive/v3/files/${savedGoogleDocFileInfo.id}?enforceSingleParent=true&addParents=${calendarNotesFolderInfo.id}`,
          headers: {
            Authorization: `Bearer ${user.googleDriveSafe.accessToken}`,
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
          const userWithRefreshedToken = await tokenService.refreshTokenNext(
            user,
            "GOOGLE",
            "DRIVE_SAFE"
          );
          try {
            const moveGoogleDocResponse = await axios({
              method: "patch",
              url: `https://www.googleapis.com/drive/v3/files/${savedGoogleDocFileInfo.id}?enforceSingleParent=true&addParents=${calendarNotesFolderInfo.id}`,
              headers: {
                Authorization: `Bearer ${userWithRefreshedToken.googleDriveSafe.accessToken}`,
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

      if (!movedGoogleDoc) {
        console.log({
          error: true,
          message:
            "Saved Google Doc, but failed to move it into user selected folder",
        });
        return response.json({
          error: true,
          message:
            "Saved Google Doc, but failed to move it into user selected folder",
        });
      }

      // Append content to Google Doc
      const googleDocBody = {
        requests: [
          {
            createParagraphBullets: {
              bulletPreset: "BULLET_CHECKBOX",
              range: {
                startIndex: 1,
                endIndex: 2,
              },
            },
          },
          {
            insertText: {
              location: {
                index: 1,
              },
              text: "Action Items\n",
            },
          },
          {
            deleteParagraphBullets: {
              range: {
                startIndex: 1,
                endIndex: 14,
              },
            },
          },
          {
            updateParagraphStyle: {
              paragraphStyle: {
                namedStyleType: "HEADING_1",
              },
              range: {
                startIndex: 1,
                endIndex: 14,
              },
              fields: "*",
            },
          },
          {
            insertText: {
              location: {
                index: 1,
              },
              text: "\n",
            },
          },
          {
            updateParagraphStyle: {
              fields: "*",
              range: {
                startIndex: 1,
                endIndex: 2,
              },
              paragraphStyle: {
                namedStyleType: "NORMAL_TEXT",
              },
            },
          },
          {
            createParagraphBullets: {
              range: {
                startIndex: 1,
                endIndex: 2,
              },
              bulletPreset: "BULLET_DISC_CIRCLE_SQUARE",
            },
          },
          {
            insertText: {
              location: {
                index: 1,
              },
              text: "Meeting Notes\n",
            },
          },
          {
            deleteParagraphBullets: {
              range: {
                startIndex: 1,
                endIndex: 14,
              },
            },
          },
          {
            updateParagraphStyle: {
              paragraphStyle: {
                namedStyleType: "HEADING_1",
              },
              range: {
                startIndex: 1,
                endIndex: 14,
              },
              fields: "*",
            },
          },
          {
            insertText: {
              location: {
                index: 1,
              },
              text: "\n",
            },
          },
          {
            updateParagraphStyle: {
              fields: "*",
              range: {
                startIndex: 1,
                endIndex: 2,
              },
              paragraphStyle: {
                namedStyleType: "NORMAL_TEXT",
              },
            },
          },
        ],
      };

      if (calendarEvent.attendees) {
        calendarEvent.attendees.forEach((attendee) => {
          googleDocBody.requests.push(
            {
              createParagraphBullets: {
                bulletPreset: "BULLET_DISC_CIRCLE_SQUARE",
                range: {
                  startIndex: 1,
                  endIndex: 2,
                },
              },
            },
            {
              insertText: {
                text: `${attendee.email}\u00A0`,
                location: {
                  index: 1,
                },
              },
            },
            {
              updateTextStyle: {
                fields: "*",
                range: {
                  startIndex: 1,
                  endIndex: `${attendee.email}`.length + 1,
                },
                textStyle: {
                  link: {
                    url: `mailto:${attendee.email}`,
                  },
                  underline: true,
                  foregroundColor: {
                    color: {
                      rgbColor: {
                        blue: 0.8,
                        green: 0.3333,
                        red: 0.0667,
                      },
                    },
                  },
                },
              },
            },
            {
              insertText: {
                location: {
                  index: 1,
                },
                text: "\n",
              },
            }
          );
        });
      }

      if (calendarEvent.attendees) {
        googleDocBody.requests.push(
          {
            deleteParagraphBullets: {
              range: {
                startIndex: 1,
                endIndex: 2,
              },
            },
          },
          {
            updateParagraphStyle: {
              fields: "*",
              range: {
                startIndex: 1,
                endIndex: 2,
              },
              paragraphStyle: {
                namedStyleType: "NORMAL_TEXT",
              },
            },
          },
          {
            insertText: {
              location: {
                index: 1,
              },
              text: "Attendees",
            },
          },
          {
            updateParagraphStyle: {
              paragraphStyle: {
                namedStyleType: "HEADING_1",
              },
              range: {
                startIndex: 1,
                endIndex: 10,
              },
              fields: "*",
            },
          },
          {
            insertText: {
              location: {
                index: 1,
              },
              text: "\n",
            },
          },
          {
            updateParagraphStyle: {
              fields: "*",
              range: {
                startIndex: 1,
                endIndex: 2,
              },
              paragraphStyle: {
                namedStyleType: "NORMAL_TEXT",
              },
            },
          }
        );
      }

      googleDocBody.requests.push(
        {
          insertText: {
            location: {
              index: 1,
            },
            text: `${eventStartTime} - ${eventEndTime}`,
          },
        },
        {
          updateParagraphStyle: {
            fields: "*",
            range: {
              startIndex: 1,
              endIndex: `${eventStartTime} - ${eventEndTime}`.length,
            },
            paragraphStyle: {
              namedStyleType: "SUBTITLE",
            },
          },
        },
        {
          insertText: {
            location: {
              index: 1,
            },
            text: "\n",
          },
        },
        {
          updateParagraphStyle: {
            fields: "*",
            range: {
              startIndex: 1,
              endIndex: 2,
            },
            paragraphStyle: {
              namedStyleType: "NORMAL_TEXT",
            },
          },
        },
        {
          insertText: {
            location: {
              index: 1,
            },
            text: `${calendarEvent.summary}`,
          },
        },
        {
          updateParagraphStyle: {
            fields: "*",
            range: {
              startIndex: 1,
              endIndex: `${calendarEvent.summary}`.length,
            },
            paragraphStyle: {
              namedStyleType: "TITLE",
            },
          },
        }
      );

      let addContentToGoogleDocResponse = null;
      try {
        addContentToGoogleDocResponse = await axios({
          method: "post",
          url: `https://docs.googleapis.com/v1/documents/${savedGoogleDocFileInfo.id}:batchUpdate`,
          data: googleDocBody,
          headers: {
            Authorization: `Bearer ${user.googleDriveSafe.accessToken}`,
          },
        });

        if (addContentToGoogleDocResponse.status !== 200) {
          addContentToGoogleDocResponse = null;
        }
      } catch (err) {
        if (err.response && err.response.status === 401) {
          const tokenService = new TokenService();
          const userWithRefreshedToken = await tokenService.refreshTokenNext(
            user,
            "GOOGLE",
            "DRIVE_SAFE"
          );

          try {
            addContentToGoogleDocResponse = await axios({
              method: "post",
              url: `https://docs.googleapis.com/v1/documents/${savedGoogleDocFileInfo.id}:batchUpdate`,
              data: googleDocBody,
              headers: {
                Authorization: `Bearer ${userWithRefreshedToken.googleDriveSafe.accessToken}`,
              },
            });

            if (addContentToGoogleDocResponse.status !== 200) {
              addContentToGoogleDocResponse = null;
            }
          } catch (err) {
            addContentToGoogleDocResponse = null;
          }
        } else {
          addContentToGoogleDocResponse = null;
        }
      }
    }

    if (user.notesStorage.current === "googleDrive") {
      // Create Google Doc w/ Title
      let googleDoc = {
        title: notesTitle,
      };

      // Save Google Doc
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
          const userWithRefreshedToken = await tokenService.refreshTokenNext(
            user,
            "GOOGLE",
            "DRIVE"
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
        return response.json({
          error: true,
          message: "Failed to create Google Doc",
        });

      // Move Google Doc to desired folder
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
          const userWithRefreshedToken = await tokenService.refreshTokenNext(
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
        return response.json({
          error: true,
          message:
            "Saved Google Doc, but failed to retrieve saved Google Doc file info",
        });

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
          const userWithRefreshedToken = await tokenService.refreshTokenNext(
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
        return response.json({
          error: true,
          message:
            "Saved Google Doc, but failed to move it into user selected folder",
        });

      // Append content to Google Doc
      const googleDocBody = {
        requests: [
          {
            createParagraphBullets: {
              bulletPreset: "BULLET_CHECKBOX",
              range: {
                startIndex: 1,
                endIndex: 2,
              },
            },
          },
          {
            insertText: {
              location: {
                index: 1,
              },
              text: "Action Items\n",
            },
          },
          {
            deleteParagraphBullets: {
              range: {
                startIndex: 1,
                endIndex: 14,
              },
            },
          },
          {
            updateParagraphStyle: {
              paragraphStyle: {
                namedStyleType: "HEADING_1",
              },
              range: {
                startIndex: 1,
                endIndex: 14,
              },
              fields: "*",
            },
          },
          {
            insertText: {
              location: {
                index: 1,
              },
              text: "\n",
            },
          },
          {
            updateParagraphStyle: {
              fields: "*",
              range: {
                startIndex: 1,
                endIndex: 2,
              },
              paragraphStyle: {
                namedStyleType: "NORMAL_TEXT",
              },
            },
          },
          {
            createParagraphBullets: {
              range: {
                startIndex: 1,
                endIndex: 2,
              },
              bulletPreset: "BULLET_DISC_CIRCLE_SQUARE",
            },
          },
          {
            insertText: {
              location: {
                index: 1,
              },
              text: "Meeting Notes\n",
            },
          },
          {
            deleteParagraphBullets: {
              range: {
                startIndex: 1,
                endIndex: 14,
              },
            },
          },
          {
            updateParagraphStyle: {
              paragraphStyle: {
                namedStyleType: "HEADING_1",
              },
              range: {
                startIndex: 1,
                endIndex: 14,
              },
              fields: "*",
            },
          },
          {
            insertText: {
              location: {
                index: 1,
              },
              text: "\n",
            },
          },
          {
            updateParagraphStyle: {
              fields: "*",
              range: {
                startIndex: 1,
                endIndex: 2,
              },
              paragraphStyle: {
                namedStyleType: "NORMAL_TEXT",
              },
            },
          },
        ],
      };

      if (calendarEvent.attendees) {
        calendarEvent.attendees.forEach((attendee) => {
          googleDocBody.requests.push(
            {
              createParagraphBullets: {
                bulletPreset: "BULLET_DISC_CIRCLE_SQUARE",
                range: {
                  startIndex: 1,
                  endIndex: 2,
                },
              },
            },
            {
              insertText: {
                text: `${attendee.email}\u00A0`,
                location: {
                  index: 1,
                },
              },
            },
            {
              updateTextStyle: {
                fields: "*",
                range: {
                  startIndex: 1,
                  endIndex: `${attendee.email}`.length + 1,
                },
                textStyle: {
                  link: {
                    url: `mailto:${attendee.email}`,
                  },
                  underline: true,
                  foregroundColor: {
                    color: {
                      rgbColor: {
                        blue: 0.8,
                        green: 0.3333,
                        red: 0.0667,
                      },
                    },
                  },
                },
              },
            },
            {
              insertText: {
                location: {
                  index: 1,
                },
                text: "\n",
              },
            }
          );
        });
      }

      if (calendarEvent.attendees) {
        googleDocBody.requests.push(
          {
            deleteParagraphBullets: {
              range: {
                startIndex: 1,
                endIndex: 2,
              },
            },
          },
          {
            updateParagraphStyle: {
              fields: "*",
              range: {
                startIndex: 1,
                endIndex: 2,
              },
              paragraphStyle: {
                namedStyleType: "NORMAL_TEXT",
              },
            },
          },
          {
            insertText: {
              location: {
                index: 1,
              },
              text: "Attendees",
            },
          },
          {
            updateParagraphStyle: {
              paragraphStyle: {
                namedStyleType: "HEADING_1",
              },
              range: {
                startIndex: 1,
                endIndex: 10,
              },
              fields: "*",
            },
          },
          {
            insertText: {
              location: {
                index: 1,
              },
              text: "\n",
            },
          },
          {
            updateParagraphStyle: {
              fields: "*",
              range: {
                startIndex: 1,
                endIndex: 2,
              },
              paragraphStyle: {
                namedStyleType: "NORMAL_TEXT",
              },
            },
          }
        );
      }

      googleDocBody.requests.push(
        {
          insertText: {
            location: {
              index: 1,
            },
            text: `${eventStartTime} - ${eventEndTime}`,
          },
        },
        {
          updateParagraphStyle: {
            fields: "*",
            range: {
              startIndex: 1,
              endIndex: `${eventStartTime} - ${eventEndTime}`.length,
            },
            paragraphStyle: {
              namedStyleType: "SUBTITLE",
            },
          },
        },
        {
          insertText: {
            location: {
              index: 1,
            },
            text: "\n",
          },
        },
        {
          updateParagraphStyle: {
            fields: "*",
            range: {
              startIndex: 1,
              endIndex: 2,
            },
            paragraphStyle: {
              namedStyleType: "NORMAL_TEXT",
            },
          },
        },
        {
          insertText: {
            location: {
              index: 1,
            },
            text: `${calendarEvent.summary}`,
          },
        },
        {
          updateParagraphStyle: {
            fields: "*",
            range: {
              startIndex: 1,
              endIndex: `${calendarEvent.summary}`.length,
            },
            paragraphStyle: {
              namedStyleType: "TITLE",
            },
          },
        }
      );

      let addContentToGoogleDocResponse = null;
      try {
        addContentToGoogleDocResponse = await axios({
          method: "post",
          url: `https://docs.googleapis.com/v1/documents/${savedGoogleDocFileInfo.id}:batchUpdate`,
          data: googleDocBody,
          headers: {
            Authorization: `Bearer ${user.googleDrive.accessToken}`,
          },
        });

        if (addContentToGoogleDocResponse.status !== 200) {
          addContentToGoogleDocResponse = null;
        }
      } catch (err) {
        if (err.response && err.response.status === 401) {
          const tokenService = new TokenService();
          const userWithRefreshedToken = await tokenService.refreshTokenNext(
            user,
            "GOOGLE",
            "DRIVE"
          );

          try {
            addContentToGoogleDocResponse = await axios({
              method: "post",
              url: `https://docs.googleapis.com/v1/documents/${savedGoogleDocFileInfo.id}:batchUpdate`,
              data: googleDocBody,
              headers: {
                Authorization: `Bearer ${userWithRefreshedToken.googleDrive.accessToken}`,
              },
            });

            if (addContentToGoogleDocResponse.status !== 200) {
              addContentToGoogleDocResponse = null;
            }
          } catch (err) {
            addContentToGoogleDocResponse = null;
          }
        } else {
          addContentToGoogleDocResponse = null;
        }
      }
    }

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
          wrikeUserId = null;
        }
      } catch (err) {
        if (err.response && err.response.status === 401) {
          const tokenService = new TokenService();
          const userWithRefreshedToken = await tokenService.refreshTokenNext(
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
              wrikeUserId = null;
            }
          } catch (err) {
            wrikeUserId = null;
          }
        } else {
          wrikeUserId = null;
        }
      }
      if (!wrikeUserId)
        return response.json({
          error: true,
          message: "Failed to retrieve Wrike User ID",
        });
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
          const userWithRefreshedToken = await tokenService.refreshTokenNext(
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
        return response.json({
          error: true,
          message: "Failed to create Wrike task",
        });

      notesPermalink = createdWrikeTask.data[0].permalink;
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
          Authorization: `Bearer ${user.googleCalendar.accessToken}`,
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
        const userWithRefreshedToken = await tokenService.refreshTokenNext(
          user,
          "GOOGLE"
        );
        try {
          const googleCreateNotesEventResponse = await axios({
            method: "post",
            url: `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
            headers: {
              Authorization: `Bearer ${userWithRefreshedToken.googleCalendar.accessToken}`,
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
      response.json({
        error: true,
        message:
          "Failed to create Google '_Notes' Event w/ Permalink to Notes File",
      });

    if (googleNotesEvent)
      response.json({
        success: true,
        message: "Created Google '_Notes' Event w/ Permalink to Notes File!",
      });
  },
};
