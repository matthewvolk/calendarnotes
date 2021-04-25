const express = require("express");

const { checkAuth } = require("../middlewares/auth");
const userController = require("../controllers/user");

const router = express.Router();

router.get("/", checkAuth, userController.getUser);
router.get("/folders", checkAuth, userController.getFolders);
router.get("/google/calendars", checkAuth, userController.getGoogleCals);
router.get("/google/drives", checkAuth, userController.listGoogleDrives);
router.get(
  "/google/calendars/:calendarId/events",
  checkAuth,
  userController.getGoogleCalEvents
);
router.post(
  "/notes/create/calendar/:calendarId/event/:eventId/folder/:folderId",
  checkAuth,
  userController.createNotes
);

module.exports = router;
