require("dotenv").config();
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
