const UserModel = require("../models/User");
const axios = require("axios");
const { startOfWeek, endOfWeek } = require("date-fns");

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
