const express = require("express");
const router = express.Router();
const User = require("../models/User");
const UserService = require("../services/UserService");
const axios = require("axios");
const passport = require("passport");
require("../config/passport")(passport);
const { ensureAuthenticated } = require("../middlewares/auth");
const { startOfWeek, endOfWeek } = require("date-fns");

/**
 * @todo Refactor UserService (WIP)
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

router.get("/wrike/folders", ensureAuthenticated, async (req, res, next) => {
  const { googleId: userId } = req.user;

  const user = new UserService();
  const folders = await user.getWrikeFolders(userId);
  res.json(folders);
});

router.post(
  /**
   * @todo Refactor to req.body, use Joi to define schema of req.body object
   */
  "/notes/create/calendar/:calendarId/event/:eventId/folder/:folderId",
  ensureAuthenticated,
  async (req, res, next) => {
    /**
     * @todo Error handling for bad data supplied with URL above
     */

    const { googleId: userId } = req.user;
    let { folderId, eventId, calendarId } = req.params;

    const user = new UserService();
    const status = await user.createNotesForEvent(
      userId,
      folderId,
      eventId,
      calendarId
    );
    res.json(status);
  }
);

module.exports = router;
