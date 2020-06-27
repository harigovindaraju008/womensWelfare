const mongoose = require("mongoose");
const joi = require("joi");
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

//validators
const consumerValidator = (data) => {
  const schemas = {
    name: joi.string().min(3).max(20),
    pwd: joi.string().min(8),
    emailId: joi.string().email(),
    phoneNO: joi.string().min(10).max(14),
    address: joi.string().min(10),
    zipCode: joi.string().min(4).max(10),
    referals: joi.object({
      referedBy: joi.string().optional().allow(""),
    }),
  };
  return joi.validate(data, schemas);
};

const savedConsumers = mongoose.model("consumers", consumerShemea);
exports.Consumers = savedConsumers;
exports.consumerValidator = consumerValidator;
