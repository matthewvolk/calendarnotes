require("dotenv").config();
const fs = require("fs");
const path = require("path");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const redis = require("redis");
const session = require("express-session");
const RedisStore = require("connect-redis")(session);
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

app.use(express.static(path.join(__dirname, "client/build")));
app.use(
  session({
    store: !!process.env.REDIS_URL
      ? new RedisStore(redis.createClient(process.env.REDIS_URL))
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

app.get("/api", (req, res) => {
  res.json({
    name: "CalendarNotes",
    version: "0.0.1 alpha",
    author: "Matthew Volk",
  });
});

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
