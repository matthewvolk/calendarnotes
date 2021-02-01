const GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;
const User = require("../models/User");

module.exports = function (passport) {
  passport.serializeUser(function (user, done) {
    done(null, user.google.id);
  });

  passport.deserializeUser(async function (id, done) {
    try {
      const user = await User.findOne({ "google.id": id }).exec();
      if (!user) done(null, false);
      else done(null, user);
    } catch (err) {
      done(err);
    }
  });

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_OAUTH2_CLIENT_ID,
        clientSecret: process.env.GOOGLE_OAUTH2_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_OAUTH2_REDIRECT_URI,
      },
      async function (accessToken, refreshToken, profile, done) {
        let user;
        try {
          user = await User.findOne({ "google.id": profile.id }).exec();
        } catch (err) {
          done(err, false);
        }

        if (user) {
          return done(null, user);
        } else {
          user = new User({
            "google.id": profile.id,
            "google.firstName": profile.name.givenName,
            "google.lastName": profile.name.familyName,
            "google.accessToken": accessToken,
            "google.refreshToken": refreshToken,
          });
          await user.save();
          return done(null, user);
        }
      }
    )
  );
};
