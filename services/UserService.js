const UserModel = require("../models/User");
const axios = require("axios");

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
      console.error("Failed to retrieve calendars in getUserCalendars()", err);
    }

    return calendars;
  }

  async refreshToken(provider, userId, token, callback) {
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
    let url = urls[provider];
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
        }
      ).exec();
      callback();
    } catch (err) {}
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
        }
      ).exec();
      return userWithRefreshedToken;
    } catch (err) {
      /**
       * @todo change to return error object?
       */
      console.error("Problem in refreshGoogleToken()", err);
    }
  }

  async refreshWrikeToken(userId, wrikeRefreshToken) {
    try {
      const response = await axios({
        method: "post",
        url: `https://${req.user.wrikeHost}/oauth2/token?client_id=${process.env.WRIKE_OAUTH2_CLIENT_ID}&client_secret=${process.env.WRIKE_OAUTH2_CLIENT_SECRET}&grant_type=refresh_token&refresh_token=${wrikeRefreshToken}`,
      });
      const user = await UserModel.findOneAndUpdate(
        { googleId: userId },
        {
          wrikeAccessToken: response.data.access_token,
          wrikeRefreshToken: response.data.refresh_token,
          wrikeHost: response.data.host,
          wrikeTokenType: response.data.token_type,
          wrikeTokenExpiresIn: response.data.expires_in,
        }
      ).exec();
      return userWithRefreshedToken;
    } catch (err) {
      /**
       * @todo
       */
      console.error("Problem in refreshGoogleToken()", err);
    }
  }
}

module.exports = UserService;
