const mongoose = require("mongoose");
const joi = require("joi");

const verifyOtpSchema = mongoose.Schema(
  {
    emailId: String,
    generatedOtp: Number,
  },
  {
    timepstamps: true,
  }
);
const savedOtpSchema = mongoose.model("otpverification", verifyOtpSchema);

const validationEmail = (data) => {
  const schema = {
    emailID: joi.string().email(),
    generatedOtp: joi.number(),
  };
  return joi.validate(data, schema);
};

exports.VerifyOtp = savedOtpSchema;
exports.validationOtp = validationEmail;
