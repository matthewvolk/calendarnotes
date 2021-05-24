const jwt = require("jsonwebtoken");
const axios = require("axios");
const TokenService = require("../services/TokenService");
const NextUser = require("../models/NextUser");

module.exports = {
  googleAuth: (_, response) => {
    response.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?scope=${encodeURIComponent(
        "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.email openid"
      )}&access_type=offline&include_granted_scopes=true&response_type=code&redirect_uri=${encodeURIComponent(
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
    const { id } = request.query;

    url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      id
    )}/events`;

    try {
      const res = await axios({
        method: "get",
        url,
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
};
