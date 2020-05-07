const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const router = require("./routes/router");
const database = require("./database");

const PORT = process.env.PORT || 3000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/lightning-ygo-api";
const isProduction = process.env.NODE_ENV === "production";

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("Successfully connected to MongoDB");

    // Day(s) * Hour(s) * Minute(s) * Second(s) * 1000
    const aDayInMilliSeconds = 1 * 24 * 60 * 60 * 1e3;

    // Update the database with any new api data once per day
    const updateDb = () => {
      database.updateDb().catch(error => console.log(error));
    };
    updateDb();
    setInterval(updateDb, aDayInMilliSeconds);
  });
mongoose.set("debug", !isProduction);

// Global app object
const app = express();

// Cors
app.use(
  cors({
    origin: ["http://localhost:8080"]
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
if (!isProduction) {
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

// Start the server
const server = app.listen(PORT, () =>
  console.log(`Server listening on port ${server.address().port}`)
);
