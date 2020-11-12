require("dotenv").config();
const path = require("path");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
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

// test heroku mongodb atlas connection

app.use(express.static(path.join(__dirname, "client/build")));
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
