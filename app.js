const express = require("express");
const cors = require("cors");
const router = require("./routes/router");

const isProduction = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";

// Global app object
const app = express();

// Cors
app.use(
  cors({
    origin: ["http://localhost:8080", "https://lightning-ygo.herokuapp.com"],
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  })
);

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use(router);

// Last middleware, creates a 404 error and forwards it to the error handler
app.use(function(req, res, next) {
  const err = new Error("Not Found");
  err.status = 404;

  next(err);
});

// Development error handler => show stacktrace
if (!isProduction && !isTest) {
  // eslint-disable-next-line
  app.use(function(err, req, res, next) {
    console.log(err.stack);

    res.status(err.status || 500);

    res.json({
      error: {
        message: err.message,
        stack: err.stack
      }
    });
  });
}

// Production error handler => no stacktrace
// eslint-disable-next-line
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    error: {
      message: err.message
    }
  });
});

module.exports = app;
