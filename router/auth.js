const express = require("express");

const { checkAuth } = require("../middlewares/auth");
const { withJwt } = require("../middlewares/withJwt");
const authController = require("../controllers/auth");

const router = express.Router();

// Next.js Testing
router.get("/google/next", authController.googleAuthNext);
router.get("/google/cb/next", authController.googleAuthCallbackNext);
// End Next.js Testing

router.get("/logout", authController.logout);
router.get("/google", authController.googleAuth);
router.get("/google/cb", authController.googleAuthCallback);
router.get("/google/drive", checkAuth, authController.googleDriveAuth);
router.get(
  "/google/drive/cb",
  checkAuth,
  authController.googleDriveAuthCallback
);
router.get("/wrike", checkAuth, authController.wrikeAuth);
router.get("/wrike/cb", checkAuth, authController.wrikeAuthCallback);

module.exports = router;
