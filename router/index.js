const express = require("express");
const router = express.Router();

const authRoutes = require("./auth");
const dateRoutes = require("./date");
const userRoutes = require("./user");

router.use("/auth", authRoutes);
router.use("/date", dateRoutes);
router.use("/user", userRoutes);

module.exports = router;
