require('dotenv').config();

const mongoose = require('mongoose');
const database = require('./database');
const app = require('./app');

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('Successfully connected to MongoDB');

    // Day(s) * Hour(s) * Minute(s) * Second(s) * 1000
    const aDayInMilliSeconds = 1 * 24 * 60 * 60 * 1e3;

    // Update the database with any new API data once per day
    const updateDb = () => {
      database.updateDb().catch(error => console.log(error));
    };
    updateDb();
    setInterval(updateDb, aDayInMilliSeconds);
  });
mongoose.set('debug', process.env.NODE_ENV !== 'production');

// Start the server
const server = app.listen(process.env.PORT, () =>
  console.log(`Server listening on port ${server.address().port}`)
);
