const mongoose = require("mongoose");
const consumerShemea = mongoose.Schema(
  {
    name: String,
    pwd: String,
    emailId: {
      type: String,
      unique: true,
    },
    phoneNO: String,
    address: String,
    zipCode: String,
    coins: Number,
    referals: {
      referalCode: String,
      referalsMembers: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "consumers",
        },
      ],
      referedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "consumers",
      },
    },
  },
  {
    timestamps: true,
  }
);

const savedConsumers = mongoose.model("consumers", consumerShemea);
module.exports = savedConsumers;
