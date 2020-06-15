const mongoose = require("mongoose");
var ObjectID = require("mongodb").ObjectID;

//schemams
const serviceProvidersSchemas = mongoose.Schema(
  {
    name: String,
    pwd: String,
    emailId: {
      type: String,
      unique: true,
    },
    zipCode: String,
    phoneNO: String,
    address: String,
    works: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          default: function () {
            return new ObjectID();
          },
        },
        catagory: [{ type: String, enum: [process.env.CATAGORY] }],
        title: String,
        descrption: String,
        offers: String,
        ratings: String,
        status: Boolean,
        reviews: [
          {
            userID: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "consumers",
            },
            messages: String,
            timestamp: { type: Date, default: Date.now },
          },
        ],
        complaints: [
          {
            userID: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "consumers",
            },
            messages: String,
            timestamp: { type: Date, default: Date.now },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

const savedServiceProviders = mongoose.model(
  "serviceProviders",
  serviceProvidersSchemas
);
module.exports = savedServiceProviders;
