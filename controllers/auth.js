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
    failureRedirect: process.env.GOOGLE_OAUTH_FAILURE_REDIRECT,
  }),

  googleAuthRedirect: (request, response) => {
    response.redirect(process.env.GOOGLE_OAUTH_REDIRECT);
  },

  googleFailure: (request, response) => {
    response.send("Failed to Authenticate with Google OAuth2");
  },

  wrikeAuth: (request, response) => {
    response.redirect(
      `https://login.wrike.com/oauth2/authorize/v4?client_id=${process.env.WRIKE_OAUTH2_CLIENT_ID}&response_type=code&redirect_uri=${process.env.WRIKE_OAUTH2_REDIRECT_URI}`
    );
  },

  wrikeAuthCallback: async (request, response, next) => {
    try {
      const wrikeResponse = await axios({
        method: "post",
        url: `https://login.wrike.com/oauth2/token?client_id=${process.env.WRIKE_OAUTH2_CLIENT_ID}&client_secret=${process.env.WRIKE_OAUTH2_CLIENT_SECRET}&grant_type=authorization_code&code=${request.query.code}&redirect_uri=${process.env.WRIKE_OAUTH2_REDIRECT_URI}`,
      });
      await User.findOneAndUpdate(
        { "google.id": request.user.google.id },
        {
          "wrike.accessToken": wrikeResponse.data.access_token,
          "wrike.refreshToken": wrikeResponse.data.refresh_token,
          "wrike.apiHost": wrikeResponse.data.host,
          "wrike.tokenType": wrikeResponse.data.token_type,
          "wrike.tokenExpiresIn": wrikeResponse.data.expires_in,
        }
      ).exec();
      response.redirect(process.env.WRIKE_OAUTH_REDIRECT);
    } catch (err) {
      next(err);
    }
  },
};
