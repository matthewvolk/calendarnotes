const express = require("express");

const { checkAuth } = require("../middlewares/auth");
const authController = require("../controllers/auth");

const router = express.Router();

router.get("/logout", authController.logout);
router.get("/google", authController.googleAuth);
router.get("/google/cb", authController.googleAuthCallback);
router.get("/wrike", checkAuth, authController.wrikeAuth);
router.get("/wrike/cb", checkAuth, authController.wrikeAuthCallback);

module.exports = router;
