const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const User = require("../models/User");
const UserService = require("../services/UserService");
const axios = require("axios");
const passport = require("passport");
require("../config/passport")(passport);
const {
  startOfWeek,
  endOfWeek,
  differenceInMinutes,
  parseISO,
  format,
} = require("date-fns");

router.get("/", (req, res) => {
  if (req.user) {
    res.json({
      logged_in: true,
      user: req.user,
    });
  } else {
    res.json({
      logged_in: false,
    });
  }
});

router.get("/delete/session", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

router.get("/user", auth.ensureAuthenticated, async (req, res) => {
  const userService = new UserService();
  try {
    const user = await userService.getUser(req.user.googleId);
    res.send(user);
  } catch (err) {
    res.send(null);
  }
});

router.get("/failure", (req, res) => {
  res.send("Failed to Authenticate with Google OAuth2");
});

router.get(
  "/google/auth",
  passport.authenticate("google", {
    scope: [
      "email",
      "profile",
      "openid",
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ],
    accessType: "offline",
    prompt: "consent",
  })
);

router.get(
  "/google/auth/callback",
  passport.authenticate("google", {
    failureRedirect: "/api/failure",
  }),
  (req, res) => {
    res.redirect("/");
  }
);

router.get(
  "/google/auth/refresh",
  auth.ensureAuthenticated,
  async (req, res) => {
    try {
      const response = await axios({
        method: "post",
        url: `https://oauth2.googleapis.com/token?client_id=${process.env.GOOGLE_OAUTH2_CLIENT_ID}&client_secret=${process.env.GOOGLE_OAUTH2_CLIENT_SECRET}&grant_type=refresh_token&refresh_token=${req.user.googleRefreshToken}`,
      });
      const user = await User.findOneAndUpdate(
        { googleId: req.user.googleId },
        {
          googleAccessToken: response.data.access_token,
          googleTokenType: response.data.token_type,
          googleTokenExpiresIn: response.data.expires_in,
          googleScopes: response.data.scope,
        }
      ).exec();
      res.redirect("/");
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/google/calendars",
  auth.ensureAuthenticated,
  async (req, res, next) => {
    try {
      const response = await axios({
        method: "get",
        url: `https://www.googleapis.com/calendar/v3/users/me/calendarList`,
        headers: {
          Authorization: `Bearer ${req.user.googleAccessToken}`,
        },
      });
      let data = response.data;
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
);

router.get("/date/today", (req, res) => {
  let today = new Date();
  let startOfCurrentWeek = startOfWeek(today).toISOString();
  let endOfCurrentWeek = endOfWeek(today).toISOString();
  res.json({
    today: today.toISOString(),
    startOfCurrentWeek,
    endOfCurrentWeek,
  });
});

router.get(
  "/google/calendars/:calendarId/events",
  auth.ensureAuthenticated,
  async (req, res, next) => {
    let today = new Date();
    let timeMin = startOfWeek(today).toISOString();
    let timeMax = endOfWeek(today).toISOString();
    let url;
    const { calendarId } = req.params;
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
          Authorization: `Bearer ${req.user.googleAccessToken}`,
        },
      });
      let data = response.data;
      res.json(data);
    } catch (err) {
      res.json(err.response.data);
    }
  }
);

router.get("/wrike/auth", auth.ensureAuthenticated, (req, res) => {
  res.redirect(
    `https://login.wrike.com/oauth2/authorize/v4?client_id=${process.env.WRIKE_OAUTH2_CLIENT_ID}&response_type=code&redirect_uri=${process.env.WRIKE_OAUTH2_REDIRECT_URI}`
  );
});

router.get(
  "/wrike/auth/callback",
  auth.ensureAuthenticated,
  async (req, res, next) => {
    try {
      const response = await axios({
        method: "post",
        url: `https://login.wrike.com/oauth2/token?client_id=${process.env.WRIKE_OAUTH2_CLIENT_ID}&client_secret=${process.env.WRIKE_OAUTH2_CLIENT_SECRET}&grant_type=authorization_code&code=${req.query.code}&redirect_uri=${process.env.WRIKE_OAUTH2_REDIRECT_URI}`,
      });
      const user = await User.findOneAndUpdate(
        { googleId: req.user.googleId },
        {
          wrikeAccessToken: response.data.access_token,
          wrikeRefreshToken: response.data.refresh_token,
          wrikeHost: response.data.host,
          wrikeTokenType: response.data.token_type,
          wrikeTokenExpiresIn: response.data.expires_in,
        }
      ).exec();
      res.redirect("/");
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/wrike/auth/refresh",
  auth.ensureAuthenticated,
  async (req, res, next) => {
    try {
      const response = await axios({
        method: "post",
        url: `https://${req.user.wrikeHost}/oauth2/token?client_id=${process.env.WRIKE_OAUTH2_CLIENT_ID}&client_secret=${process.env.WRIKE_OAUTH2_CLIENT_SECRET}&grant_type=refresh_token&refresh_token=${req.user.wrikeRefreshToken}`,
      });
      const user = await User.findOneAndUpdate(
        { googleId: req.user.googleId },
        {
          wrikeAccessToken: response.data.access_token,
          wrikeRefreshToken: response.data.refresh_token,
          wrikeHost: response.data.host,
          wrikeTokenType: response.data.token_type,
          wrikeTokenExpiresIn: response.data.expires_in,
        }
      ).exec();
      res.redirect("/");
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/wrike/profile",
  auth.ensureAuthenticated,
  async (req, res, next) => {
    try {
      const response = await axios({
        method: "get",
        url: `https://${req.user._doc.wrikeHost}/api/v4/contacts?me`,
        headers: {
          Authorization: `Bearer ${req.user.wrikeAccessToken}`,
        },
      });
      console.dir(response.data.data[0]);
      const user = await User.findOneAndUpdate(
        { googleId: req.user.googleId },
        {
          wrikeFirstName: response.data.data[0].firstName,
          wrikeLastName: response.data.data[0].lastName,
        }
      ).exec();
      res.redirect("/");
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/wrike/folders",
  auth.ensureAuthenticated,
  async (req, res, next) => {
    try {
      const response = await axios({
        method: "get",
        url: `https://${req.user._doc.wrikeHost}/api/v4/folders`,
        headers: {
          Authorization: `Bearer ${req.user.wrikeAccessToken}`,
        },
      });
      res.json({ spaces: response.data });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/wrike/spaces/:spaceId/folders",
  auth.ensureAuthenticated,
  async (req, res, next) => {
    let { spaceId } = req.params;
    try {
      const response = await axios({
        method: "get",
        url: `https://${req.user._doc.wrikeHost}/api/v4/spaces/${spaceId}/folders`,
        headers: {
          Authorization: `Bearer ${req.user.wrikeAccessToken}`,
        },
      });
      res.json({ spaces: response.data });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/notes/create/calendar/:calendarId/event/:eventId/folder/:folderId",
  auth.ensureAuthenticated,
  async (req, res, next) => {
    /**
     * @todo
     * 1. Error handling for bad data supplied with URL above
     */

    // let tempGoogleAuth;
    // let tempWrikeAuth;
    // let tempWrikeContact;

    let { folderId, eventId, calendarId } = req.params;
    let eventResponse;
    try {
      eventResponse = await axios({
        method: "get",
        url: `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
        headers: {
          Authorization: `Bearer ${req.user.googleAccessToken}`,
        },
      });
      console.log("Retrieved Google Calendar Event!");
    } catch (err) {
      next(err);
    }

    // console.dir(eventResponse);

    let wrikeBody = {};
    wrikeBody.title =
      eventResponse.data.summary +
      ` - ${format(
        parseISO(eventResponse.data.start.dateTime),
        "EEEE, MMMM d ⋅ H:mmaaaaa'm' - "
      )}${format(parseISO(eventResponse.data.end.dateTime), "H:mmaaaaa'm'")}`;
    wrikeBody.description = `<h4><b>Attendees</b></h4><ul>`;
    eventResponse.data.attendees.forEach((obj, index) => {
      if (!obj.organizer) {
        wrikeBody.description += `<li><a href="mailto:${obj.email}">${obj.email}</a></li>`;
      }
    });
    wrikeBody.description += `</ul><h4><b>Meeting Notes</b></h4><ul><label><li></li></label></ul><h4>Action Items</h4><ul class='checklist' style='list-style-type: none;'><li><label><input type='checkbox' /><b>[ ASSIGNEE_NAME ]:</b>&nbsp;</label></li></ul>`;
    wrikeBody.dates = {};
    wrikeBody.dates.type = "Planned";
    wrikeBody.dates.duration = differenceInMinutes(
      parseISO(eventResponse.data.end.dateTime),
      parseISO(eventResponse.data.start.dateTime)
    );
    wrikeBody.dates.start = format(
      parseISO(eventResponse.data.start.dateTime),
      "yyyy-MM-dd'T'HH:mm:ss"
    );
    wrikeBody.dates.due = format(
      parseISO(eventResponse.data.end.dateTime),
      "yyyy-MM-dd'T'HH:mm:ss"
    );

    /**
     * @todo
     * either make an api call to contacts?me or use current logged in Wrike user
     * from React
     */

    wrikeBody.responsibles = [];

    try {
      const wrikeContactResponse = await axios({
        method: "get",
        url: `https://${req.user._doc.wrikeHost}/api/v4/contacts?me=true`,
        headers: {
          Authorization: `Bearer ${req.user.wrikeAccessToken}`,
        },
      });
      wrikeBody.responsibles.push(wrikeContactResponse.data.data.id);
      console.log(
        "Retrieved Wrike Contact ID!",
        wrikeContactResponse.data.data.id
      );
    } catch (err) {
      console.error(err);
      next(err);
    }

    let wrikeResponse;

    try {
      wrikeResponse = await axios({
        method: "post",
        url: `https://${req.user._doc.wrikeHost}/api/v4/folders/${folderId}/tasks`,
        headers: {
          Authorization: `Bearer ${req.user.wrikeAccessToken}`,
        },
        data: wrikeBody,
      });
      console.log("Created Wrike Task!");
    } catch (err) {
      console.error(err);
      next(err);
    }

    let googleEventCreationResponse;

    try {
      googleEventCreationResponse = await axios({
        method: "post",
        url: `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
        headers: {
          Authorization: `Bearer ${req.user.googleAccessToken}`,
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
      res.json({ status: 200, message: "Success!" });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
