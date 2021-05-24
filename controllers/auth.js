const User = require("../models/User");
const axios = require("axios");
const passport = require("passport");
require("../config/passport")(passport);

module.exports = {
  logout: (request, response) => {
    request.session.destroy();
    response.redirect(process.env.LOGOUT_REDIRECT);
  },

  googleAuth: passport.authenticate("google", {
    scope: [
      "email",
      "profile",
      "openid",
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ],
    accessType: "offline",
    prompt: "consent",
  }),

  googleAuthCallback: passport.authenticate("google", {
    successRedirect: process.env.GOOGLE_OAUTH_REDIRECT,
    failureRedirect: process.env.GOOGLE_OAUTH_FAILURE_REDIRECT,
  }),

  googleDriveAuth: (request, response) => {
    response.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?client_id=${
        process.env.GOOGLE_OAUTH2_CLIENT_ID
      }&redirect_uri=${encodeURIComponent(
        process.env.GOOGLE_DRIVE_OAUTH_REDIRECT_URI
      )}&response_type=code&scope=${encodeURIComponent(
        "https://www.googleapis.com/auth/drive"
      )}&access_type=offline&prompt=consent`
    );
  },

  googleDriveAuthCallback: async (request, response) => {
    const { error, code } = request.query;

    if (code) {
      const googleDriveCreds = await axios({
        method: "post",
        url: `https://oauth2.googleapis.com/token?client_id=${
          process.env.GOOGLE_OAUTH2_CLIENT_ID
        }&client_secret=${
          process.env.GOOGLE_OAUTH2_CLIENT_SECRET
        }&code=${code}&grant_type=authorization_code&redirect_uri=${encodeURIComponent(
          process.env.GOOGLE_DRIVE_OAUTH_REDIRECT_URI
        )}`,
      });
      const user = await User.findOne({ "google.id": request.user.google.id });
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
      response.redirect(process.env.GOOGLE_OAUTH_REDIRECT);
    }

    if (error) {
      response.redirect(process.env.GOOGLE_OAUTH_REDIRECT);
    }
  },

  /**
   * @todo deleteGoogleDriveAuth
   * so user can log in with a different google drive account
   */

  /**
   * @todo deleteWrikeAuth
   * so user can log in with a different wrike account
   */

  wrikeAuth: (request, response) => {
    response.redirect(
      `https://login.wrike.com/oauth2/authorize/v4?client_id=${
        process.env.WRIKE_OAUTH2_CLIENT_ID
      }&response_type=code&redirect_uri=${encodeURIComponent(
        process.env.WRIKE_OAUTH2_REDIRECT_URI
      )}`
    );
  },

  wrikeAuthCallback: async (request, response, next) => {
    const { code, error } = request.query;

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
            process.env.WRIKE_OAUTH2_REDIRECT_URI
          )}`,
        });
        const user = await User.findOne({
          "google.id": request.user.google.id,
        });
        user.wrike.accessToken = wrikeResponse.data.access_token;
        user.wrike.refreshToken = wrikeResponse.data.refresh_token;
        user.wrike.apiHost = wrikeResponse.data.host;
        user.wrike.tokenType = wrikeResponse.data.token_type;
        user.wrike.tokenExpiresIn = wrikeResponse.data.expires_in;
        user.notesStorage.current = "wrike";
        user.notesStorage.available.push({ id: "wrike", name: "Wrike" });
        await user.save();
        response.redirect(process.env.WRIKE_OAUTH_REDIRECT);
      } catch (err) {
        next(err);
      }
    }

    if (error) {
      response.redirect(process.env.WRIKE_OAUTH_REDIRECT);
    }
  },
};
