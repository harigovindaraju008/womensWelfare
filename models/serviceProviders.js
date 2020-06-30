const mongoose = require("mongoose");
const joi = require("joi");

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
        type: new mongoose.Schema({
          catagory: [{ type: String, enum: [process.env.CATAGORY] }],
          title: String,
          descrption: String,
          images: Array,
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
        }),
      },
    ],
    jobs: [
      {
        type: new mongoose.Schema(
          {
            companyName: String,
            title: String,
            description: String,
            salary: String,
            salaryType: String,
            vacancies: String,
            address: String,
            contactNo: String,
            skills: String,
            verified: Boolean,
          },
          {
            timestamps: true,
          }
        ),
      },
    ],
  },
  { timestamps: true }
);

//serviceProviders validations

const validateServiceProviders = (data) => {
  const schemas = {
    name: joi.string().min(3).max(20),
    pwd: joi.string().min(8),
    emailId: joi.string().email(),
    phoneNO: joi.string().min(10).max(14),
    address: joi.string().min(10),
    zipCode: joi.string().min(4).max(10),
    id: joi.objectId(),
    works: joi.object({
      catagory: joi.string().min(3).max(50),
      title: joi.string().min(5).max(20),
      descrption: joi.string().min(10).max(200),
      offers: joi.string().min(5).max(200),
      status: joi.boolean(),
    }),
    jobs: joi.object({
      companyName: joi.string().required().min(4),
      title: joi.string().required().min(4),
      description: joi.string().required().min(4),
      salary: joi.string().required().min(4),
      salaryType: joi.string().required().min(4),
      vacancies: joi.string().required().min(1),
      address: joi.string().required().min(4),
      contactNo: joi.string().required().min(4),
      skills: joi.string().min(4),
      verified: joi.boolean().required(),
    }),
    reviews: joi.object({
      userID: joi.string(),
      messages: joi.string(),
    }),
    complaints: joi.object({
      userID: joi.string(),
      messages: joi.string(),
    }),
  };
  return joi.validate(data, schemas);
};

const savedServiceProviders = mongoose.model(
  "serviceProviders",
  serviceProvidersSchemas
);
exports.ServiceProviders = savedServiceProviders;
exports.validateServiceProviders = validateServiceProviders;
