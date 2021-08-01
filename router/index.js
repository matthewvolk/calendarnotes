const express = require("express");
const router = express.Router();

const nextRoutes = require("./next");

router.use("/next", nextRoutes);

module.exports = router;
