const UserModel = require("../models/User");
const TokenService = require("./TokenService");
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

class StorageService {
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

  /**
   * Combine listGoogleDrives and getFolders into a StorageService or something
   */
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
          const tokenService = new TokenService();
          const userWithRefreshedToken = await tokenService.refreshToken(
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
          const tokenService = new TokenService();
          const userWithRefreshedToken = await tokenService.refreshToken(
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
          const tokenService = new TokenService();
          const userWithRefreshedToken = await tokenService.refreshToken(
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
        const tokenService = new TokenService();
        const userWithRefreshedToken = await tokenService.refreshToken(
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
          const tokenService = new TokenService();
          const userWithRefreshedToken = await tokenService.refreshToken(
            user,
            "WRIKE"
          );

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
        const tokenService = new TokenService();
        const userWithRefreshedToken = await tokenService.refreshToken(
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
        } catch (err) {
          console.log("Promise.all() failed:", err);
          return { error: true };
        }
      }
    }

    return folderResponse;
  }
}

module.exports = StorageService;
