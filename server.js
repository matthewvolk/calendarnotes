require("dotenv").config();
const fs = require("fs");
const path = require("path");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const redis = require("redis");
const session = require("express-session");
const RedisStore = require("connect-redis")(session);
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;
const axios = require("axios");
const { startOfWeek, endOfWeek } = require("date-fns");
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
    store: !!process.env.REDIS_URL
      ? new RedisStore({ client: redis.createClient(process.env.REDIS_URL) })
      : null,
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
    date: `https://${req.get("host")}/api/date/today`,
    googleCalendars: `https://${req.get("host")}/api/google/calendars`,
    googleCalendarEvents: `/api/google/calendars/:calendarId/events`,
    wrikeLogin: `https://${req.get("host")}/api/wrike/auth`,
    wrikeRefresh: `https://${req.get("host")}/api/wrike/auth/refresh`,
    wrikeProfile: `https://${req.get("host")}/api/wrike/profile`,
    wrikeSpaces: `https://${req.get("host")}/api/wrike/spaces`,
    wrikeFolders: `/api/wrike/spaces/:spaceId/folders`,
    logOut: `https://${req.get("host")}/api/delete/session`,
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

app.get("/api/delete/session", (req, res) => {
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
    res.redirect("/");
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
    res.redirect("/");
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

app.get("/api/date/today", (req, res) => {
  let today = new Date();
  let startOfCurrentWeek = startOfWeek(today).toISOString();
  let endOfCurrentWeek = endOfWeek(today).toISOString();
  res.json({
    today: today.toISOString(),
    startOfCurrentWeek,
    endOfCurrentWeek,
  });
});

app.get(
  "/api/google/calendars/:calendarId/events",
  ensureAuthenticated,
  async (req, res, next) => {
    let url;
    const { calendarId } = req.params;
    const { timeMax, timeMin } = req.query;
    if (timeMax && timeMin) {
      url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?timeMax=${timeMax}&timeMin=${timeMin}`;
    } else {
      url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`;
    }
    try {
      const response = await axios({
        method: "get",
        url,
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

app.get("/api/wrike/auth", ensureAuthenticated, (req, res) => {
  res.redirect(
    `https://login.wrike.com/oauth2/authorize/v4?client_id=${process.env.WRIKE_OAUTH2_CLIENT_ID}&response_type=code&redirect_uri=${process.env.WRIKE_OAUTH2_REDIRECT_URI}`
  );
});

app.get(
  "/api/wrike/auth/callback",
  ensureAuthenticated,
  async (req, res, next) => {
    try {
      const response = await axios({
        method: "post",
        url: `https://login.wrike.com/oauth2/token?client_id=${process.env.WRIKE_OAUTH2_CLIENT_ID}&client_secret=${process.env.WRIKE_OAUTH2_CLIENT_SECRET}&grant_type=authorization_code&code=${req.query.code}&redirect_uri=${process.env.WRIKE_OAUTH2_REDIRECT_URI}`,
      });
      const user = await User.findOneAndUpdate(
        { googleId: req.user.googleId },
        {
          wrikeAccessToken: response.data.access_token,
          wrikeRefreshToken: response.data.refresh_token,
          wrikeHost: response.data.host,
          wrikeTokenType: response.data.token_type,
          wrikeTokenExpiresIn: response.data.expires_in,
        }
      ).exec();
      res.redirect("/");
    } catch (err) {
      next(err);
    }
  }
);

app.get(
  "/api/wrike/auth/refresh",
  ensureAuthenticated,
  async (req, res, next) => {
    try {
      const response = await axios({
        method: "post",
        url: `https://${req.user.wrikeHost}/oauth2/token?client_id=${process.env.WRIKE_OAUTH2_CLIENT_ID}&client_secret=${process.env.WRIKE_OAUTH2_CLIENT_SECRET}&grant_type=refresh_token&refresh_token=${req.user.wrikeRefreshToken}`,
      });
      const user = await User.findOneAndUpdate(
        { googleId: req.user.googleId },
        {
          wrikeAccessToken: response.data.access_token,
          wrikeRefreshToken: response.data.refresh_token,
          wrikeHost: response.data.host,
          wrikeTokenType: response.data.token_type,
          wrikeTokenExpiresIn: response.data.expires_in,
        }
      ).exec();
      res.redirect("/");
    } catch (err) {
      next(err);
    }
  }
);

app.get("/api/wrike/profile", ensureAuthenticated, async (req, res, next) => {
  try {
    const response = await axios({
      method: "get",
      url: `https://${req.user._doc.wrikeHost}/api/v4/contacts?me`,
      headers: {
        Authorization: `Bearer ${req.user.wrikeAccessToken}`,
      },
    });
    const user = await User.findOneAndUpdate(
      { googleId: req.user.googleId },
      {
        wrikeFirstName: response.data.data[0].firstName,
        wrikeLastName: response.data.data[0].lastName,
      }
    ).exec();
    res.redirect("/");
  } catch (err) {
    next(err);
  }
});

app.get("/api/wrike/spaces", ensureAuthenticated, async (req, res, next) => {
  try {
    const response = await axios({
      method: "get",
      url: `https://${req.user._doc.wrikeHost}/api/v4/spaces`,
      headers: {
        Authorization: `Bearer ${req.user.wrikeAccessToken}`,
      },
    });
    res.json({ spaces: response.data });
  } catch (err) {
    next(err);
  }
});

app.get(
  "/api/wrike/spaces/:spaceId/folders",
  ensureAuthenticated,
  async (req, res, next) => {
    let { spaceId } = req.params;
    try {
      const response = await axios({
        method: "get",
        url: `https://${req.user._doc.wrikeHost}/api/v4/spaces/${spaceId}/folders`,
        headers: {
          Authorization: `Bearer ${req.user.wrikeAccessToken}`,
        },
      });
      res.json({ spaces: response.data });
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
 * [ ] https://support.google.com/cloud/answer/9110914?hl=en
 * [ ] https://www.indiehackers.com/forum/how-to-handle-user-sessions-in-a-node-and-react-app-e7b467048b
 * [ ] https://stackoverflow.com/questions/61126689/how-to-override-express-api-routes-with-react-router
 * [ ] https://stackoverflow.com/questions/41069593/how-do-i-handle-errors-in-passport-deserializeuser
 * [ ] https://stackoverflow.com/questions/44362205/passport-nodeerror-failed-to-deserialize-user-out-of-session
 * [ ] https://stackoverflow.com/questions/35359295/how-does-passport-js-stores-user-object-in-session
 * [ ] https://stackoverflow.com/questions/27637609/understanding-passport-serialize-deserialize
 */

/**
 * @notes
 * - Flush Heroku Redis Cache: $ heroku redis:cli, $ flushall
 */
