const express = require("express");
const router = express.Router();
const User = require("../models/User");
const UserService = require("../services/UserService");
const axios = require("axios");
const passport = require("passport");
const moment = require("moment-timezone");
require("../config/passport")(passport);
const { ensureAuthenticated } = require("../middlewares/auth");
const {
  startOfWeek,
  endOfWeek,
  differenceInMinutes,
  parseISO,
  format,
} = require("date-fns");

/**
 * @todo Refactor UserService (WIP)
 * @todo Handle refresh tokens (WIP)
 * @todo Add persistence in knowing which events have notes created for them
 * @todo Refactor User Schema
 * @todo Handle Notes Location folder tree
 * @todo Add styles
 * @todo add "logout with wrike" so that you can change wrike accounts if needed
 */

router.get("/user", ensureAuthenticated, async (req, res) => {
  const user = req.user;
  res.json(user);
});

router.get("/delete/session", (req, res) => {
  req.session.destroy();
  res.redirect("/");
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

router.get("/failure", (req, res) => {
  res.send("Failed to Authenticate with Google OAuth2");
});

router.get("/wrike/auth", ensureAuthenticated, (req, res) => {
  res.redirect(
    `https://login.wrike.com/oauth2/authorize/v4?client_id=${process.env.WRIKE_OAUTH2_CLIENT_ID}&response_type=code&redirect_uri=${process.env.WRIKE_OAUTH2_REDIRECT_URI}`
  );
});

router.get(
  "/wrike/auth/callback",
  ensureAuthenticated,
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

router.get("/google/calendars", ensureAuthenticated, async (req, res, next) => {
  const { googleId: userId } = req.user;
  const user = new UserService();
  const calendars = await user.getUserCalendars(userId);
  res.json(calendars);
});

router.get("/date/today", (req, res) => {
  /**
   * Input: N/A
   * Output: today's date, beginning of week, end of week
   *
   * Maybe refactor this so input is a date, and instead this provides start and end of week for that date
   */
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
  ensureAuthenticated,
  async (req, res) => {
    const { googleId: userId } = req.user;
    const { calendarId } = req.params;

    const user = new UserService();
    const calendarEvents = await user.getCalendarEvents(userId, calendarId);
    res.json(calendarEvents);
  }
);

/**
 * @todo modify this to be a UserService method that returns folders
 */
router.get("/wrike/folders", ensureAuthenticated, async (req, res, next) => {
  /**
   * Input: req.user._doc.wrikeHost, req.user.wrikeAccessToken
   * Output: list of Wrike folders
   */

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
});

router.post(
  /**
   * @todo Refactor to req.body, use Joi to define schema of req.body object
   */
  "/notes/create/calendar/:calendarId/event/:eventId/folder/:folderId",
  ensureAuthenticated,
  async (req, res, next) => {
    /**
     * Input: calendarId, eventId, folderId, googleAccessToken, wrikeAccessToken, wrikeContact
     * Output: create wrike task, create google calendar event
     */

    /**
     * @todo Error handling for bad data supplied with URL above
     */

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
      console.error(err.response.data);
      console.error(err.response.status);
      next(err);
    }

    let userTimeZone;
    try {
      const response = await axios({
        method: "get",
        url: `https://www.googleapis.com/calendar/v3/users/me/calendarList/${calendarId}`,
        headers: {
          Authorization: `Bearer ${req.user.googleAccessToken}`,
        },
      });
      userTimeZone = response.data.timeZone;
    } catch (err) {
      next(err);
    }

    /**
     * @todo below, handle case of all-day events where there is no datetime
     */

    let eventStartTime = new Date(eventResponse.data.start.dateTime); // "2020-12-21T13:00:00-06:00"
    let eventEndTime = new Date(eventResponse.data.end.dateTime); // "2020-12-21T13:30:00-06:00"

    let momentStart = moment
      .tz(eventStartTime, userTimeZone)
      .format("dddd, MMMM Do ⋅ h:mma");
    let momentEnd = moment.tz(eventEndTime, userTimeZone).format("h:mma z");

    let wrikeBody = {};
    wrikeBody.title = `${eventResponse.data.summary} - ${momentStart} - ${momentEnd}`;
    wrikeBody.description = `<h4><b>Attendees</b></h4><ul>`;
    if (eventResponse.data.attendees) {
      eventResponse.data.attendees.forEach((obj, index) => {
        wrikeBody.description += `<li><a href="mailto:${obj.email}">${obj.email}</a></li>`;
      });
    } else {
      wrikeBody.description += `<li><a href="mailto:${eventResponse.data.organizer.email}">${eventResponse.data.organizer.email}</a></li>`;
    }
    wrikeBody.description += `</ul><h4><b>Meeting Notes</b></h4><ul><label><li></li></label></ul><h4><b>Action Items</b></h4><ul class='checklist' style='list-style-type: none;'><li><label><input type='checkbox' /></label></li></ul>`;
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

    wrikeBody.responsibles = [];

    try {
      const wrikeContactResponse = await axios({
        method: "get",
        url: `https://${req.user._doc.wrikeHost}/api/v4/contacts?me=true`,
        headers: {
          Authorization: `Bearer ${req.user.wrikeAccessToken}`,
        },
      });
      wrikeBody.responsibles.push(wrikeContactResponse.data.data[0].id);
      console.log(
        "Retrieved Wrike Contact ID!",
        wrikeContactResponse.data.data[0].id
      );
    } catch (err) {
      console.error(err.response.data);
      console.error(err.response.status);
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
      console.error(err.response.data);
      console.error(err.response.status);
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
      console.error(err.response.data);
      console.error(err.response.status);
      next(err);
    }
  }
);

module.exports = router;
