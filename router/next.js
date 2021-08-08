const express = require("express");

const { withJwt } = require("../middlewares/withJwt");
const { jwtQuery } = require("../middlewares/jwtQuery");
const nextController = require("../controllers/next");

const router = express.Router();

router.get("/google", nextController.googleAuth);
router.get("/google/cb", nextController.googleAuthCallback);
router.get("/user", withJwt, nextController.googleUser);
router.get("/calendars", withJwt, nextController.googleCalendars);
router.post("/calendars/default", withJwt, nextController.defaultCalendar);
router.get("/notes/storage", withJwt, nextController.notesStorage);
router.get("/events", withJwt, nextController.googleEvents);
router.get("/google/drive/safe", jwtQuery, nextController.googleDriveAuthSafe);
router.get("/google/drive/cb/safe", nextController.googleDriveAuthCallbackSafe);
router.get("/google/drive/check", withJwt, nextController.googleDriveAuthCheck);
router.get("/wrike", jwtQuery, nextController.wrikeAuth);
router.get("/wrike/cb", nextController.wrikeAuthCallback);
router.get("/folders", withJwt, nextController.getFolders);
router.post("/notes", withJwt, nextController.createNotes);

module.exports = router;
