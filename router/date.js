const express = require("express");

const dateController = require("../controllers/date");

const router = express.Router();

router.get("/today", dateController.today);

module.exports = router;
