const express = require("express");
const router = express.Router();
const User = require("../models/User");
const UserService = require("../services/UserService");
const axios = require("axios");
const passport = require("passport");
require("../config/passport")(passport);
const { ensureAuthenticated } = require("../middlewares/auth");
const { startOfWeek, endOfWeek } = require("date-fns");

router.get("/user", ensureAuthenticated, async (req, res) => {
  const user = req.user;
  res.json(user);
});

router.get("/delete/session", (req, res) => {
  req.session.destroy();
  res.redirect(process.env.LOGOUT_REDIRECT);
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
    failureRedirect: process.env.GOOGLE_OAUTH_FAILURE_REDIRECT,
  }),
  (req, res) => {
    res.redirect(process.env.GOOGLE_OAUTH_REDIRECT);
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
        { "google.id": req.user.google.id },
        {
          "wrike.accessToken": response.data.access_token,
          "wrike.refreshToken": response.data.refresh_token,
          "wrike.apiHost": response.data.host,
          "wrike.tokenType": response.data.token_type,
          "wrike.tokenExpiresIn": response.data.expires_in,
        }
      ).exec();
      res.redirect(process.env.WRIKE_OAUTH_REDIRECT);
    } catch (err) {
      next(err);
    }
  }
);

router.get("/google/calendars", ensureAuthenticated, async (req, res, next) => {
  const {
    google: { id: userId },
  } = req.user;
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
    const {
      google: { id: userId },
    } = req.user;
    const { calendarId } = req.params;

    const user = new UserService();
    const calendarEvents = await user.getCalendarEvents(userId, calendarId);
    res.json(calendarEvents);
  }
);

router.get("/wrike/folders", ensureAuthenticated, async (req, res, next) => {
  const {
    google: { id: userId },
  } = req.user;

  const user = new UserService();
  const folders = await user.getWrikeFolders(userId);
  res.json(folders);
});

router.get("/folders", ensureAuthenticated, async (req, res) => {
  // wrikeFolderService takes request
  // determines if response from Wrike is top level space or sub folder
  // if top level space, wrikeFolderService needs to make another call immediately and uniquely for Wrike
  // becuase initial wrike Spaces response doesn't give childFolders

  const { clickedFolderId } = req.query;
  const requestingUser = req.user;

  const folderGetter = new UserService();

  /**
   * @todo this needs to be prepared to catch Error object from services/UserService.js:352
   * @todo then, needs to give client some notice to retry the action
   */
  const folderData = await folderGetter.getFolders(
    requestingUser,
    clickedFolderId
  );
  res.json(folderData);
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

    const {
      google: { id: userId },
    } = req.user;
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
