const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  googleId: String,
  googleAccessToken: String,
  googleRefreshToken: String,
  googleTokenExpiresIn: Number,
  googleScopes: String,
  googleTokenType: String,
  googleSelectedCalendar: String,
  wrikeAccessToken: String,
  wrikeRefreshToken: String,
  wrikeHost: String,
  wrikeTokenType: String,
  wrikeTokenExpiresIn: Number,
  wrikeFirstName: String,
  wrikeLastName: String,
});

// const newUserSchema = new mongoose.Schema({
//   google: {
//     firstName: String,
//     lastName: String,
//     id: String,
//     accessToken: String,
//     refreshToken: String,
//     tokenExpiresIn: Number,
//     accessScopes: String,
//     tokenType: String
//   },
//   wrike: {
//     firstName: String,
//     lastName: String,
//     accessToken: String,
//     refreshToken: String,
//     apiHost: String,
//     tokenType: String,
//     tokenExpiresIn: Number,
//   },
// });
const User = mongoose.model("User", userSchema);

module.exports = User;
