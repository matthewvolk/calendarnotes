const express = require("express");
const router = express.Router();

const { checkAuth } = require("../middlewares/auth");

const authController = require("../controllers/auth");
const userController = require("../controllers/user");
const dateController = require("../controllers/date");

router.get("/user", checkAuth, userController.getUser);
router.get("/delete/session", authController.logout);
router.get("/google/auth", authController.googleAuth);
router.get(
  "/google/auth/callback",
  authController.googleAuthCallback,
  authController.googleAuthRedirect
);
router.get("/failure", authController.googleFailure);
router.get("/wrike/auth", checkAuth, authController.wrikeAuth);
router.get("/wrike/auth/callback", checkAuth, authController.wrikeAuthCallback);
router.get("/google/calendars", checkAuth, userController.getGoogleCals);
router.get("/date/today", dateController.today);
router.get(
  "/google/calendars/:calendarId/events",
  checkAuth,
  userController.getGoogleCalEvents
);
router.get("/folders", checkAuth, userController.getFolders);
router.post(
  /**
   * @todo Refactor to req.body, use Joi to define schema of req.body object
   */
  "/notes/create/calendar/:calendarId/event/:eventId/folder/:folderId",
  checkAuth,
  userController.createNotes
);

module.exports = router;
