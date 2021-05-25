const jwt = require("jsonwebtoken");
const axios = require("axios");
const NextUser = require("../models/NextUser");
const DateService = require("../services/DateService");
const TokenService = require("../services/TokenService");

module.exports = {
  googleAuth: (_, response) => {
    response.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?scope=${encodeURIComponent(
        "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.email openid"
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
      const user = await NextUser.findOne({ id: googleUser.id }).exec();
      if (!user) {
        const newUser = new NextUser({
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
        });
        await newUser.save();
      }
      const token = jwt.sign({ id: googleUser.id }, "SECRET");
      response.redirect(`http://localhost:3000/dashboard?token=${token}`);
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

    const userDoc = await NextUser.findOne({ id: user.id });

    if (location === "googleDrive") {
      userDoc.notesStorage.current = "googleDrive";
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
          }
          response.json(null);
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
            const tokenService = new TokenService();
            const userWithRefreshedToken = await tokenService.refreshTokenNext(
              user,
              "WRIKE"
            );

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

  googleDriveAuth: (request, response) => {
    const user = request.user;
    response.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?client_id=${
        process.env.GOOGLE_OAUTH2_CLIENT_ID
      }&redirect_uri=${encodeURIComponent(
        process.env.GOOGLE_DRIVE_OAUTH_REDIRECT_URI_NEXT
      )}&response_type=code&scope=${encodeURIComponent(
        "https://www.googleapis.com/auth/drive"
      )}&access_type=offline&prompt=consent&state=${encodeURIComponent(
        `${user.id}`
      )}`
    );
  },

  googleDriveAuthCallback: async (request, response) => {
    const { error, code, state: id } = request.query;

    if (code) {
      const googleDriveCreds = await axios({
        method: "post",
        url: `https://oauth2.googleapis.com/token?client_id=${
          process.env.GOOGLE_OAUTH2_CLIENT_ID
        }&client_secret=${
          process.env.GOOGLE_OAUTH2_CLIENT_SECRET
        }&code=${code}&grant_type=authorization_code&redirect_uri=${encodeURIComponent(
          process.env.GOOGLE_DRIVE_OAUTH_REDIRECT_URI_NEXT
        )}`,
      });
      const user = await NextUser.findOne({ id });
      user.googleDrive.accessToken = googleDriveCreds.data.access_token;
      user.googleDrive.expiresIn = googleDriveCreds.data.expires_in;
      user.googleDrive.refreshToken = googleDriveCreds.data.refresh_token;
      user.googleDrive.scope = googleDriveCreds.data.scope;
      user.googleDrive.tokenType = googleDriveCreds.data.token_type;
      user.notesStorage.current = "googleDrive";
      user.notesStorage.available.push({
        id: "googleDrive",
        name: "Google Drive",
      });
      await user.save();
      response.redirect(process.env.GOOGLE_OAUTH_REDIRECT_NEXT);
    }

    if (error) {
      response.redirect(process.env.GOOGLE_OAUTH_REDIRECT_NEXT);
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
        const user = await NextUser.findOne({ id });
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
};
