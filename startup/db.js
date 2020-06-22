const winston = require("winston");
const mongoose = require("mongoose");

module.exports = function () {
  const db = process.env.MONGODB_URL;
  mongoose.set("useCreateIndex", true);
  mongoose
    .connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    })
    .then(() => winston.info(`Connected to ${db}...`));
};
