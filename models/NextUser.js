const mongoose = require("mongoose");

const nextUserSchema = new mongoose.Schema({
  id: String,
  name: String,
  email: String,
  picture: String,
  givenName: String,
  familyName: String,
  googleCalendar: {
    defaultCalId: String,
    accessToken: String,
    refreshToken: String,
    expiresIn: Number,
    scope: String,
    tokenType: String,
  },
  googleDrive: {
    accessToken: String,
    refreshToken: String,
    expiresIn: Number,
    scope: String,
    tokenType: String,
  },
  googleDriveSafe: {
    accessToken: String,
    refreshToken: String,
    expiresIn: Number,
    scope: String,
    tokenType: String,
    folderId: String,
  },
  wrike: {
    accessToken: String,
    refreshToken: String,
    expiresIn: Number,
    tokenType: String,
    apiHost: String,
  },
  notesStorage: {
    current: String,
    available: [{ id: String, name: String }],
  },
});

const NextUser = mongoose.model("NextUser", nextUserSchema);

module.exports = NextUser;
