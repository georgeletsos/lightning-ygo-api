const mongoose = require("mongoose");
const database = require("./database");
const app = require("./app");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/lightning-ygo-api";
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Successfully connected to MongoDB");

    // Day(s) * Hour(s) * Minute(s) * Second(s) * 1000
    const aDayInMilliSeconds = 1 * 24 * 60 * 60 * 1e3;

    // Update the database with any new API data once per day
    const updateDb = () => {
      database.updateDb().catch((error) => console.log(error));
    };
    updateDb();
    setInterval(updateDb, aDayInMilliSeconds);
  });
mongoose.set("debug", !isProduction);

// Start the server
const server = app.listen(PORT, () =>
  console.log(`Server listening on port ${server.address().port}`)
);
