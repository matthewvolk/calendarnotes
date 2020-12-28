const express = require("express");
const router = express.Router();
const User = require("../models/User");
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

/**
 * @todo replace "/" with this
 */
router.get("/user", ensureAuthenticated, async (req, res) => {
  const user = req.user;
  res.json(user);
});

router.get("/delete/session", (req, res) => {
  /**
   * Input: req.session
   * Output: void
   */

  req.session.destroy();
  res.redirect("/");
});

router.get("/failure", (req, res) => {
  /**
   * Input: N/A
   * Output: N/A
   *
   * Consider the Passport failureRedirect to go to React instead
   */

  res.send("Failed to Authenticate with Google OAuth2");
});

router.get(
  /**
   * Input: N/A
   * Output: N/A
   *
   * Passport's middleware, serialize, and deserialization should use a UserService object
   */

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
  /**
   * Input: N/A
   * Output: N/A
   *
   * Passport's middleware, serialize, and deserialization should use a UserService object
   */

  "/google/auth/callback",
  passport.authenticate("google", {
    failureRedirect: "/api/failure",
  }),
  (req, res) => {
    res.redirect("/");
  }
);

/**
 * @todo delete this, instead just have a UserService method that retries after refreshing
 */
router.get("/google/auth/refresh", ensureAuthenticated, async (req, res) => {
  /**
   * Input: req.user, User Model
   * Output: Update User Model with refreshed tokens
   */

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
});

router.get("/google/calendars", ensureAuthenticated, async (req, res, next) => {
  /**
   * Input: req.user.googleAccessToken
   * Output: list of Google calendars
   */

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
  async (req, res, next) => {
    /**
     * Input: Calendar ID, req.user.googleAccessToken, timeMin, timeMax
     * Output: list of events for the week specified
     */

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

router.get("/wrike/auth", ensureAuthenticated, (req, res) => {
  /**
   * Input: N/A
   * Output: N/A
   */

  res.redirect(
    `https://login.wrike.com/oauth2/authorize/v4?client_id=${process.env.WRIKE_OAUTH2_CLIENT_ID}&response_type=code&redirect_uri=${process.env.WRIKE_OAUTH2_REDIRECT_URI}`
  );
});

router.get(
  "/wrike/auth/callback",
  ensureAuthenticated,
  async (req, res, next) => {
    /**
     * Input: N/A
     * Output: update user object with Wrike tokens
     */

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

/**
 * @todo delete this, instead just have a UserService method that retries after refreshing
 */
router.get(
  "/wrike/auth/refresh",
  ensureAuthenticated,
  async (req, res, next) => {
    /**
     * Input: req.user.wrikeRefreshToken
     * Output: update user object with refreshed wrike tokens
     */

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
   * @todo After refactor, send client timezone in req.body
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
     * @todo Fix timezone bug, need to retrieve timezone from client, not use the one on the server
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
     * @todo below, map days of the week and months of the year from index to string
     * @todo potentially turn logic below into function?
     */

    let eventStartTime = new Date(eventResponse.data.start.dateTime); // "2020-12-21T13:00:00-06:00"
    let eventEndTime = new Date(eventResponse.data.end.dateTime); // "2020-12-21T13:30:00-06:00"
    /**
     * @todo is there an edge case where start timeZone is different than end timeZone?
     * @todo instead of using the event's timezone, should I just use the current user's calendar timezone?
     */
    let eventTimeZone = eventResponse.data.start.timeZone;

    let momentStart = moment
      .tz(eventStartTime, userTimeZone)
      .format("dddd, MMMM Do ⋅ h:mm a");
    let momentEnd = moment.tz(eventEndTime, userTimeZone).format("h:mm a");

    let eventStartDay = eventStartTime.getDay();
    let eventStartMonth = eventStartTime.getMonth();
    let eventStartDate = eventStartTime.getDate();
    let formattedEventStartTime = eventStartTime
      .toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      .toLowerCase()
      .replace(/ /g, "");
    let formattedEventEndTime = eventEndTime
      .toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      .toLowerCase()
      .replace(/ /g, "");

    console.dir({
      debug: "=======================================",
      momentStart, // 'Tuesday, December 29th ⋅ 3:00 pm',
      momentEnd, // '4:00 pm',
      formattedEventStartTime, // '2:00pm',
      formattedEventEndTime, // '3:00pm',
      eventTimeZone, // 'Europe/Amsterdam'
      userTimeZone,
    });

    const numToMonth = (num) => {
      if (num < 0 || num > 11) {
        return new Error("num must be a number between 0 and 11");
        /**
         * @todo res.json should reflect this
         */
      }
      const monthMap = {
        0: "January",
        1: "February",
        2: "March",
        3: "April",
        4: "May",
        5: "June",
        6: "July",
        7: "August",
        8: "September",
        9: "October",
        10: "November",
        11: "December",
      };
      return monthMap[num];
    };

    const numToDay = (num) => {
      if (num < 0 || num > 6) {
        return new Error("num must be a number between 0 and 6");
        /**
         * @todo res.json should reflect this
         */
      }
      const dayMap = {
        0: "Sunday",
        1: "Monday",
        2: "Tuesday",
        3: "Wednesday",
        4: "Thursday",
        5: "Friday",
        6: "Saturday",
      };
      return dayMap[num];
    };

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
