const express = require("express");

const { withJwt } = require("../middlewares/withJwt");
const nextController = require("../controllers/next");

const router = express.Router();

router.get("/google", nextController.googleAuth);
router.get("/google/cb", nextController.googleAuthCallback);
router.get("/user", withJwt, nextController.googleUser);
router.get("/calendars", withJwt, nextController.googleCalendars);
router.get("/events", withJwt, nextController.googleEvents);

module.exports = router;
