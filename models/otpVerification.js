const mongoose = require("mongoose");
const joi = require("joi");

const verifyOtpSchema = mongoose.Schema(
  {
    emailId: { type: String, require: true },
    generatedOtp: {
      type: Number,
      require: true,
    },
  },
  {
    timepstamps: true,
  }
);
const savedOtpSchema = mongoose.model("otpverification", verifyOtpSchema);

const validationEmail = (data) => {
  const schema = {
    emailId: joi.string().email().required(),
    generatedOtp: joi.number(),
  };
  return joi.validate(data, schema);
};

exports.VerifyOtp = savedOtpSchema;
exports.validationOtp = validationEmail;
