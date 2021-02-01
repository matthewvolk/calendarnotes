const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
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
  wrike: {
    firstName: String,
    lastName: String,
    accessToken: String,
    refreshToken: String,
    tokenExpiresIn: Number,
    tokenType: String,
    apiHost: String,
  },
});
const User = mongoose.model("User", userSchema);

module.exports = User;
