const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  google: {
    id: String,
    firstName: String,
    lastName: String,
    accessToken: String,
    refreshToken: String,
    tokenExpiresIn: Number,
    tokenType: String,
    accessScopes: String,
  },
  googleDrive: {
    accessToken: String,
    expiresIn: Number,
    refreshToken: String,
    scope: String,
    tokenType: String,
  },
  wrike: {
    firstName: String,
    lastName: String,
    accessToken: String,
    refreshToken: String,
    tokenExpiresIn: Number,
    tokenType: String,
    apiHost: String,
  },
  notesStorage: {
    current: String,
    available: [{ id: String, name: String }],
  },
  defaultCalendar: String,
});
const User = mongoose.model("User", userSchema);

module.exports = User;
