const User = require("../models/User");
const axios = require("axios");

class TokenService {
  async refreshTokenNext(user, provider, resource = "AUTH") {
    if (!provider) {
      return new RangeError(
        "Paramater 'provider' must be provided as a string and equal to either 'GOOGLE' or 'WRIKE'"
      );
    }

    let googleRefreshToken = null;

    if (resource === "AUTH") {
      googleRefreshToken = user.googleCalendar.refreshToken;
    }
    if (resource === "DRIVE") {
      googleRefreshToken = user.googleDrive.refreshToken;
    }
    if (resource === "DRIVE_SAFE") {
      googleRefreshToken = user.googleDriveSafe.refreshToken;
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
        userWithRefreshedToken = await User.findOneAndUpdate(
          { id: user.id },
          {
            "googleCalendar.accessToken": response.data.access_token,
            "googleCalendar.tokenType": response.data.token_type,
            "googleCalendar.expiresIn": response.data.expires_in,
            "googleCalendar.scope": response.data.scope,
          },
          { new: true }
        ).exec();
      }

      if (provider === "GOOGLE" && resource === "DRIVE") {
        userWithRefreshedToken = await User.findOneAndUpdate(
          { id: user.id },
          {
            "googleDrive.accessToken": response.data.access_token,
            "googleDrive.tokenType": response.data.token_type,
            "googleDrive.expiresIn": response.data.expires_in,
            "googleDrive.scope": response.data.scope,
          },
          { new: true }
        ).exec();
      }

      if (provider === "GOOGLE" && resource === "DRIVE_SAFE") {
        userWithRefreshedToken = await User.findOneAndUpdate(
          { id: user.id },
          {
            "googleDriveSafe.accessToken": response.data.access_token,
            "googleDriveSafe.tokenType": response.data.token_type,
            "googleDriveSafe.expiresIn": response.data.expires_in,
            "googleDriveSafe.scope": response.data.scope,
          },
          { new: true }
        ).exec();
      }

      if (provider === "WRIKE") {
        userWithRefreshedToken = await User.findOneAndUpdate(
          { id: user.id },
          {
            "wrike.accessToken": response.data.access_token,
            "wrike.refreshToken": response.data.refresh_token,
            "wrike.apiHost": response.data.host,
            "wrike.tokenType": response.data.token_type,
            "wrike.expiresIn": response.data.expires_in,
          },
          { new: true }
        ).exec();
      }

      return userWithRefreshedToken;
    } catch (err) {
      console.error("Problem in refreshTokenNext()", err);
    }
  }
}

module.exports = TokenService;
