require("dotenv").config();
const fs = require("fs");
const path = require("path");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const redis = require("redis").createClient(process.env.REDIS_URL);
const session = require("express-session");
const RedisStore = require("connect-redis")(session);
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;
const axios = require("axios");
const port = process.env.PORT || 5000;
const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGODB_CONNECTION_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Successfully connected to MongoDB"))
  .catch((err) => {
    console.log(`MongoDB Connection Error: ${err.message}`);
  });

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  googleId: String,
  googleAccessToken: String,
  googleRefreshToken: String,
  googleTokenExpiresIn: Number,
  googleScopes: String,
  googleTokenType: String,
  wrikeAccessToken: String,
  wrikeRefreshToken: String,
  wrikeHost: String,
  wrikeTokenType: String,
  wrikeTokenExpiresIn: Number,
  wrikeFirstName: String,
  wrikeLastName: String,
});
const User = mongoose.model("User", userSchema);

passport.serializeUser(function (user, done) {
  done(null, user.googleId);
});

passport.deserializeUser(async function (id, done) {
  try {
    const user = await User.findOne({ googleId: id }).exec();
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
        user = await User.findOne({ googleId: profile.id }).exec();
      } catch (err) {
        done(err, false);
      }

      if (user) {
        return done(null, user);
      } else {
        user = new User({
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          googleId: profile.id,
          googleAccessToken: accessToken,
          googleRefreshToken: refreshToken,
        });
        await user.save();
        return done(null, user);
      }
    }
  )
);

app.use(express.static(path.join(__dirname, "client/build")));
app.use(
  session({
    store: !!process.env.REDIS_URL ? new RedisStore(redis) : null,
    secret: process.env.SESSION_SECRET,
    resave: process.env.REDIS_URL ? false : true,
    saveUninitialized: false,
    cooke: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7 * 365,
    },
  })
);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(passport.initialize());
app.use(passport.session());

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  else res.status(401).send("Unauthorized");
}

app.get("/api", (req, res) => {
  const links = {
    home: `https://${req.get("host")}/api/`,
    user: `https://${req.get("host")}/api/user`,
    googleLogin: `https://${req.get("host")}/api/google/auth`,
    googleRefresh: `https://${req.get("host")}/api/google/auth/refresh`,
    googleCalendars: `https://${req.get("host")}/api/google/calendars`,
    deleteSession: `https://${req.get("host")}/api/delete/session`,
  };

  if (req.user) {
    res.json({
      name: "CalendarNotes",
      version: "0.0.1 alpha",
      author: "Matthew Volk",
      logged_in: true,
      links,
      user: req.user,
      session: req.session,
    });
  } else {
    res.json({
      name: "CalendarNotes",
      version: "0.0.1 alpha",
      author: "Matthew Volk",
      logged_in: false,
      links,
      session: req.session,
    });
  }
});

app.get("/api/delete/session", ensureAuthenticated, (req, res) => {
  req.session.destroy();
  res.redirect("/api");
});

app.get("/api/user", ensureAuthenticated, async (req, res) => {
  try {
    user = await User.findOne({ googleId: req.user.googleId }).exec();
    res.send(user);
  } catch (err) {
    res.send("Error from catch within /api/user!");
  }
});

app.get("/api/failure", (req, res) => {
  res.send("Failed to Authenticate with Google OAuth2");
});

app.get(
  "/api/google/auth",
  passport.authenticate("google", {
    scope: [
      "email",
      "profile",
      "openid",
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ],
    accessType: "offline",
    prompt: "consent",
  })
);

app.get(
  "/api/google/auth/callback",
  passport.authenticate("google", {
    failureRedirect: "/api/failure",
  }),
  (req, res) => {
    res.redirect("/api");
  }
);

app.get("/api/google/auth/refresh", ensureAuthenticated, async (req, res) => {
  try {
    const response = await axios({
      method: "post",
      url: `https://oauth2.googleapis.com/token?client_id=${process.env.GOOGLE_OAUTH2_CLIENT_ID}&client_secret=${process.env.GOOGLE_OAUTH2_CLIENT_SECRET}&grant_type=refresh_token&refresh_token=${req.user.googleRefreshToken}`,
    });
    const user = await User.findOneAndUpdate(
      { googleId: req.user.googleId },
      {
        googleAccessToken: response.data.access_token,
        googleTokenType: response.data.token_type,
        googleTokenExpiresIn: response.data.expires_in,
        googleScopes: response.data.scope,
      }
    ).exec();
    res.redirect("/api");
  } catch (err) {
    next(err);
  }
});

app.get(
  "/api/google/calendars",
  ensureAuthenticated,
  async (req, res, next) => {
    try {
      const response = await axios({
        method: "get",
        url: `https://www.googleapis.com/calendar/v3/users/me/calendarList`,
        headers: {
          Authorization: `Bearer ${req.user.googleAccessToken}`,
        },
      });
      let data = response.data;
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/client/build/index.html"));
});

app.listen(port, () => {
  console.log(`HTTP server listening on http://localhost:${port}`);
});

// https for local dev
if (process.env.NODE_ENV === "local") {
  require("https")
    .createServer(
      {
        key: fs.readFileSync("./localhost.key"),
        cert: fs.readFileSync("./localhost.crt"),
      },
      app
    )
    .listen(8443, () => {
      console.log(`HTTPS server listening at https://localhost:8443/api`);
    });
}

/**
 * @todo
 * 1. https://stackoverflow.com/questions/61126689/how-to-override-express-api-routes-with-react-router
 */
