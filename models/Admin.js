const mongoose = require("mongoose");
const adminShemea = mongoose.Schema(
  {
    name: String,
    pwd: String,
    emailId: {
      type: String,
      unique: true,
    },
    phoneNO: String,
    INC_referalcoins: Number,
  },
  {
    timestamps: true,
  }
);

const savedAdmin = mongoose.model("admin", adminShemea);
module.exports = savedAdmin;
