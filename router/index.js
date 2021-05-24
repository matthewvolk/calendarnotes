const express = require("express");
const router = express.Router();

const authRoutes = require("./auth");
const userRoutes = require("./user");
const nextRoutes = require("./next");

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/next", nextRoutes);

module.exports = router;
