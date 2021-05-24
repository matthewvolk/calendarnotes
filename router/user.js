const express = require("express");

const { checkAuth } = require("../middlewares/auth");
const userController = require("../controllers/user");

const router = express.Router();

router.get("/", checkAuth, userController.getUser);
router.get("/folders", checkAuth, userController.getFolders);
router.get("/google/calendars", checkAuth, userController.getGoogleCals);
router.post(
  "/google/calendars/default",
  checkAuth,
  userController.updateDefaultCalendar
);
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
router.get("/notes/storage", checkAuth, userController.getNotesStorageInfo);
router.post("/notes/storage", checkAuth, userController.updateNotesStorageInfo);

module.exports = router;
