require("dotenv").config();
const fs = require("fs");
const path = require("path");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const redis = require("redis");
const session = require("express-session");
const RedisStore = require("connect-redis")(session);
const mongoose = require("mongoose");

const passport = require("passport");
require("./config/passport")(passport);

const port = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_CONNECTION_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Successfully connected to MongoDB"))
  .catch((err) => {
    console.log(`MongoDB Connection Error: ${err.message}`);
  });

/**
 * @notes
 * - Flush Heroku Redis Cache: $ heroku redis:cli, $ flushall
 */

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
 * Bulletproof Architecture: https://softwareontheroad.com/ideal-nodejs-project-structure/#architecture
 *     - https://mannhowie.com/clean-architecture-node
 *     - https://www.codementor.io/@evanbechtol/node-service-oriented-architecture-12vjt9zs9i
 *     - https://stackoverflow.com/a/42164174
 * Dependency injection: https://cdn-media-1.freecodecamp.org/images/1*TF-VdAgPfcD497kAW77Ukg.png
 * [ ] https://support.google.com/cloud/answer/9110914?hl=en
 * [ ] https://www.indiehackers.com/forum/how-to-handle-user-sessions-in-a-node-and-react-app-e7b467048b
 * [ ] https://stackoverflow.com/questions/61126689/how-to-override-express-api-routes-with-react-router
 * [ ] https://stackoverflow.com/questions/41069593/how-do-i-handle-errors-in-passport-deserializeuser
 * [ ] https://stackoverflow.com/questions/44362205/passport-nodeerror-failed-to-deserialize-user-out-of-session
 * [ ] https://stackoverflow.com/questions/35359295/how-does-passport-js-stores-user-object-in-session
 * [ ] https://stackoverflow.com/questions/27637609/understanding-passport-serialize-deserialize
 *
 * [ ] When someone changes their response to "Not Going" or "Maybe", potentially update the meeting notes.
 *
 */

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

app.use("/api", require("./api"));

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
