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

const auth = require("./middlewares/auth");

/**
 * @todo create Wrike and Google Axios clients
 * const myClient = axios.create({
 *    baseUrl: "https://api.example.com",
 *    headers: {
 *      Authorization: "Bearer ..."
 *    }
 * })
 *
 * try {
 *    const res = await myClient.get("/test")
 *    const data = res.data
 * } catch (err) {
 *    handleError(err)
 * }
 *
 * @todo
 * Dependency injection: https://cdn-media-1.freecodecamp.org/images/1*TF-VdAgPfcD497kAW77Ukg.png
 */

const {
  startOfWeek,
  endOfWeek,
  differenceInMinutes,
  parseISO,
  format,
} = require("date-fns");
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
  googleSelectedCalendar: String,
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

app.get("/api", (req, res) => {
  if (req.user) {
    res.json({
      logged_in: true,
      user: req.user,
    });
  } else {
    res.json({
      logged_in: false,
    });
  }
});

app.get("/api/delete/session", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

app.get("/api/user", auth.ensureAuthenticated, async (req, res) => {
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

app.get(
  "/api/google/auth/refresh",
  auth.ensureAuthenticated,
  async (req, res) => {
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
  }
);

app.get(
  "/api/google/calendars",
  auth.ensureAuthenticated,
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
  auth.ensureAuthenticated,
  async (req, res, next) => {
    let today = new Date();
    let timeMin = startOfWeek(today).toISOString();
    let timeMax = endOfWeek(today).toISOString();
    let url;
    const { calendarId } = req.params;
    if (timeMax && timeMin) {
      url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?timeMax=${timeMax}&timeMin=${timeMin}&singleEvents=true`;
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
      res.json(err.response.data);
    }
  }
);

app.get("/api/wrike/auth", auth.ensureAuthenticated, (req, res) => {
  res.redirect(
    `https://login.wrike.com/oauth2/authorize/v4?client_id=${process.env.WRIKE_OAUTH2_CLIENT_ID}&response_type=code&redirect_uri=${process.env.WRIKE_OAUTH2_REDIRECT_URI}`
  );
});

app.get(
  "/api/wrike/auth/callback",
  auth.ensureAuthenticated,
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
  auth.ensureAuthenticated,
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

app.get(
  "/api/wrike/profile",
  auth.ensureAuthenticated,
  async (req, res, next) => {
    try {
      const response = await axios({
        method: "get",
        url: `https://${req.user._doc.wrikeHost}/api/v4/contacts?me`,
        headers: {
          Authorization: `Bearer ${req.user.wrikeAccessToken}`,
        },
      });
      console.dir(response.data.data[0]);
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
  }
);

app.get(
  "/api/wrike/spaces",
  auth.ensureAuthenticated,
  async (req, res, next) => {
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
  }
);

app.get(
  "/api/wrike/spaces/:spaceId/folders",
  auth.ensureAuthenticated,
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

app.post(
  "/api/notes/create/calendar/:calendarId/event/:eventId/folder/:folderId",
  auth.ensureAuthenticated,
  async (req, res, next) => {
    /**
     * @todo
     * 1. Error handling for bad data supplied with URL above
     */

    // let tempGoogleAuth;
    // let tempWrikeAuth;
    // let tempWrikeContact;

    let { folderId, eventId, calendarId } = req.params;
    let eventResponse;
    try {
      eventResponse = await axios({
        method: "get",
        url: `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
        headers: {
          Authorization: `Bearer ${req.user.googleAccessToken}`,
        },
      });
      console.log("Retrieved Google Calendar Event!");
    } catch (err) {
      next(err);
    }

    console.dir(eventResponse);

    let wrikeBody = {};
    wrikeBody.title =
      eventResponse.data.summary +
      ` - ${format(
        parseISO(eventResponse.data.start.dateTime),
        "EEEE, MMMM d ⋅ H:mmaaaaa'm' - "
      )}${format(parseISO(eventResponse.data.end.dateTime), "H:mmaaaaa'm'")}`;
    wrikeBody.description = `<h4><b>Attendees</b></h4><ul>`;
    eventResponse.data.attendees.forEach((obj, index) => {
      if (!obj.organizer) {
        wrikeBody.description += `<li><a href="mailto:${obj.email}">${obj.email}</a></li>`;
      }
    });
    wrikeBody.description += `</ul><h4><b>Meeting Notes</b></h4><ul><label><li></li></label></ul><h4>Action Items</h4><ul class='checklist' style='list-style-type: none;'><li><label><input type='checkbox' /><b>[ ASSIGNEE_NAME ]:</b>&nbsp;</label></li></ul>`;
    wrikeBody.dates = {};
    wrikeBody.dates.type = "Planned";
    wrikeBody.dates.duration = differenceInMinutes(
      parseISO(eventResponse.data.end.dateTime),
      parseISO(eventResponse.data.start.dateTime)
    );
    wrikeBody.dates.start = format(
      parseISO(eventResponse.data.start.dateTime),
      "yyyy-MM-dd'T'HH:mm:ss"
    );
    wrikeBody.dates.due = format(
      parseISO(eventResponse.data.end.dateTime),
      "yyyy-MM-dd'T'HH:mm:ss"
    );

    /**
     * @todo
     * either make an api call to contacts?me or use current logged in Wrike user
     * from React
     */
    wrikeBody.responsibles = [tempWrikeContact];

    let wrikeResponse;

    try {
      wrikeResponse = await axios({
        method: "post",
        url: `https://${req.user._doc.wrikeHost}/api/v4/folders/${folderId}/tasks`,
        headers: {
          Authorization: `Bearer ${req.user.wrikeAccessToken}`,
        },
        data: wrikeBody,
      });
      console.log("Created Wrike Task!");
    } catch (err) {
      console.error(err);
      next(err);
    }

    let googleEventCreationResponse;

    try {
      googleEventCreationResponse = await axios({
        method: "post",
        url: `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
        headers: {
          Authorization: `Bearer ${req.user.googleAccessToken}`,
        },
        data: {
          summary: "_Notes",
          description: wrikeResponse.data.data[0].permalink,
          start: {
            dateTime: eventResponse.data.start.dateTime,
          },
          end: {
            dateTime: eventResponse.data.end.dateTime,
          },
          reminders: {
            useDefault: false,
          },
          colorId: "8",
        },
      });
      console.log("Created Google Calendar Notes Task!");
      res.send("Success!");
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
if (process.env.NODE_ENV === "development") {
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
 *
 * [ ] When someone changes their response to "Not Going" or "Maybe", potentially update the meeting notes.
 */

/**
 * @notes
 * - Flush Heroku Redis Cache: $ heroku redis:cli, $ flushall
 */
