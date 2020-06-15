//custom imports
const ServiceProviders = require("../models/serviceProviders");
const verifyProviders = require("../middlewares/verifyTokenProviders");
const { saveImage, loadImage } = require("../utils/imageProcess");
//npm packages
const express = require("express");
const routers = express.Router();
const joi = require("joi");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

//geting all services Providers
routers.get("/", verifyProviders, async (req, res) => {
  const allServiceProviders = await ServiceProviders.find({});
  //   .populate({
  //     path: "referals.referalsMembers",
  //   })
  //   .populate({
  //     path: "referals.referedBy",
  //   });
  res.send(allServiceProviders);
});

//getting particular login services Providers
routers.get("/userInfo", verifyProviders, async (req, res) => {
  const currentServiceProviders = await ServiceProviders.findOne({
    emailId: req.emailId,
  });
  //   .populate({
  //     path: "referals.referalsMembers",
  //   })
  //   .populate({
  //     path: "referals.referedBy",
  //   });
  res.send(currentServiceProviders);
});

//geting service provider image
routers.get("/:id/providerImage", verifyProviders, async (req, res) => {
  const serviceProviderId = req.params.id;
  loadImage("serviceProviders.image", serviceProviderId, res);
});

//user work info
routers.get("/userWorkInfo/:id", async (req, res) => {
  try {
    const ID = req.params.id;
    const getingWorkInfo = await ServiceProviders.findOne({ "works._id": ID });
    // console.log(getingWorkInfo);
    res.status(200).send(getingWorkInfo);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

//regisation service Providers
routers.post("/register", async (req, res) => {
  const { error } = validateServiceProviders(req.body);
  if (error) {
    res.status(400).send(error.details[0].message);
    return;
  }
  try {
    const providersDetails = req.body;
    const vaildEmail = await ServiceProviders.findOne({
      emailId: providersDetails.emailId,
    });
    if (vaildEmail) {
      //   console.log(vaildEmail, consumerDetails.emailId);
      res.status(400).send("email is exist");
      return;
    }
    const hash = await bcrypt.hash(providersDetails.pwd, 10); //password hashing
    const reqProviders = new ServiceProviders({
      name: providersDetails.name,
      emailId: providersDetails.emailId,
      pwd: hash,
      phoneNO: providersDetails.phoneNO,
      address: providersDetails.address,
      zipCode: providersDetails.zipCode,
    });
    const savedProviders = await reqProviders.save();

    //if (req.file && req.file.fieldname === "serviceProviderImage" && savedProviders._id) {
    if (req.files && req.files.serviceProviderImage) {
      let ProviderImage = req.files.serviceProviderImage;
      let fileName = "" + savedProviders._id;
      await saveImage("serviceProviders.image", ProviderImage, fileName);
      if (savedProviders) {
        res.status(200).send("succsssfully register");
      } else {
        res.status(400).send(new Error("issues in saving data"));
      }
    } else {
      res.status(400).send(new Error("issues in saving data"));
    }
  } catch (err) {
    res.status(400).send(err.message);
  }
});

//login seviceProviders
routers.post("/login", async (req, res) => {
  const { error } = validateServiceProviders(req.body);
  if (error) {
    res.status(400).send(error.details[0].message);
    return;
  }
  const verifyingUser = await ServiceProviders.findOne({
    emailId: req.body.emailId,
  });
  if (!verifyingUser) {
    res.status(400).send("emailid or password invalid");
    return;
  }
  const verifyingUserPwd = await bcrypt.compare(
    req.body.pwd,
    verifyingUser.pwd
  );

  if (!verifyingUserPwd) {
    res.status(400).send("emailid or password invalid");
    return;
  }
  try {
    const SecretKey = process.env.SECRET_KEY;
    const emailId = { emailId: verifyingUser.emailId };
    const token = jwt.sign(emailId, SecretKey);
    res
      .status(200)
      .header({ provider_token: token })
      .json({ provider_token: token });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

//adding workers
routers.post("/addworkers", verifyProviders, async (req, res) => {
  const { error, value } = validateServiceProviders(req.body);
  if (error) {
    res.status(400).send(error.details[0].message);
    return;
  }
  //   console.log(value.works);
  try {
    const updateServiceProvider = await ServiceProviders.findByIdAndUpdate(
      value.id,
      {
        $push: { works: [value.works] },
      }
    );
    // console.log(updateServiceProvider);
    if (updateServiceProvider) {
      return res.status(200).send("updated successfully");
    } else {
      res.status(400).send("invalid ID");
    }
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

//adding reviews
routers.post("/userReview", async (req, res) => {
  const { error, value } = validateServiceProviders(req.body);
  if (error) {
    res.status(400).send(error.details[0].message);
    return;
  }
  const checkingWorkID = mongoose.Types.ObjectId.isValid(value.id.toString());
  const checkingConsumerID = mongoose.Types.ObjectId.isValid(
    value.reviews.userID.toString()
  );
  if (checkingWorkID && checkingConsumerID !== true) {
    return res.status(400).send("invalid userID or WorkID");
  }
  try {
    // console.log(value.reviews);
    await ServiceProviders.findOneAndUpdate(
      { "works._id": value.id },
      {
        $push: {
          "works.$.reviews": [value.reviews],
        },
      }
    );

    res.status(200).send("Thanks for the valuable reviews");
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

//adding compliant
routers.post("/userCompliant", async (req, res) => {
  const { error, value } = validateServiceProviders(req.body);
  if (error) {
    res.status(400).send(error.details[0].message);
    return;
  }
  const checkingWorkID = mongoose.Types.ObjectId.isValid(value.id.toString());
  const checkingConsumerID = mongoose.Types.ObjectId.isValid(
    value.complaints.userID.toString()
  );
  if (checkingWorkID && checkingConsumerID !== true) {
    return res.status(400).send("invalid userID or WorkID");
  }
  try {
    // console.log(value.reviews);
    await ServiceProviders.findOneAndUpdate(
      { "works._id": value.id },
      {
        $push: {
          "works.$.complaints": [value.complaints],
        },
      }
    );

    res.status(200).send("Thanks for the complaint reviews");
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

routers.put("/updateProvider/:id", async (req, res) => {
  const { error, value } = validateServiceProviders(req.body);
  if (error) {
    res.status(400).send(error.details[0].message);
    return;
  }
  const checkingWorkID = mongoose.Types.ObjectId.isValid(
    req.params.id.toString()
  );
  if (!checkingWorkID) {
    return res.status(400).send("Invalid Provider Id");
  }
  const updateProvider = await ServiceProviders.findByIdAndUpdate(
    req.params.id,
    value
  );
  if (updateProvider) {
    res.status(200).send("successfully updated");
  } else {
    res.status(400).send("Invalid Provider Id");
  }
});

routers.put("/updateProviderPic/:id", async (req, res) => {
  const checkingWorkID = mongoose.Types.ObjectId.isValid(
    req.params.id.toString()
  );

  if (!checkingWorkID) {
    return res.status(400).send("Invalid Provider Id");
  }
  const updateProviderPic = await ServiceProviders.findById(req.params.id);
  if (updateProviderPic) {
    //if (req.file && req.file.fieldname === "serviceProviderImage" && savedProviders._id) {
    if (req.files && req.files.serviceProviderImage) {
      let ProviderImage = req.files.serviceProviderImage;
      let fileName = "" + updateProviderPic._id;
      await saveImage("serviceProviders.image", ProviderImage, fileName);
      res.status(200).send("succsssfully updated");
    } else {
      res.status(400).send(new Error("issues in saving data"));
    }
  } else {
    res.status(400).send("Invalid Provider Id");
  }
});

//serviceProviders validations
const validateServiceProviders = (data) => {
  const schemas = {
    name: joi.string().min(3).max(20),
    pwd: joi.string().min(8),
    emailId: joi.string().email(),
    phoneNO: joi.string().min(10).max(14),
    address: joi.string().min(10),
    zipCode: joi.string().min(4).max(10),
    id: joi.string(),
    works: joi.object({
      catagory: joi.string().min(3).max(50),
      title: joi.string().min(5).max(20),
      descrption: joi.string().min(10).max(200),
      offers: joi.string().min(5).max(200),
      status: joi.boolean(),
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

module.exports = routers; //exporting models
