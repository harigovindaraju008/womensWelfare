//custom imports
const Consumers = require("../models/consumer");
const verifyTokenUser = require("../middlewares/verifyTokenUsers");

//npm packages
const express = require("express");
const routers = express.Router();
const joi = require("joi");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//custom middelware
const ReferalsMiddleware = async (req, res, next) => {
  const referedValue = req.body.referals.referedBy || req.query.referedBy;
  if (referedValue !== "" && referedValue !== undefined) {
    const referedBy = await Consumers.findOne({
      "referals.referalCode": referedValue,
    });
    if (referedBy) {
      return next();
    }
    return res.status(400).send("invaild referal code");
  }
  return next();
};

//fetching all consumers
routers.get("/", verifyTokenUser, async (req, res) => {
  const allConsumers = await Consumers.find({})
    .populate({
      path: "referals.referalsMembers",
    })
    .populate({
      path: "referals.referedBy",
    });
  res.send(allConsumers);
});

//getting particular login user
routers.get("/userInfo", verifyTokenUser, async (req, res) => {
  const currentConsumers = await Consumers.findOne({ emailId: req.emailId })
    .populate({
      path: "referals.referalsMembers",
    })
    .populate({
      path: "referals.referedBy",
    });
  res.send(currentConsumers);
});

// registers consumers
routers.post("/register", ReferalsMiddleware, async (req, res) => {
  //for validation
  // console.log(req.body);
  const { error } = consumerValidator(req.body);
  if (error) {
    res.status(400).send(error.details[0].message);
    return;
  }

  //checking with database
  try {
    const consumerDetails = req.body;
    const vaildEmail = await Consumers.findOne({
      emailId: consumerDetails.emailId,
    });
    if (vaildEmail) {
      //   console.log(vaildEmail, consumerDetails.emailId);
      res.status(400).send("email is exist");
      return;
    }
    const referedValue = req.body.referals.referedBy || req.query.referedBy;
    // console.log(referedValue);
    const referedBy = await checkingReferals(referedValue, res); // checking referals
    const hash = await bcrypt.hash(consumerDetails.pwd, 10); //password hashing
    const generateReferCode = await generatingReferalCode(); // genrateting referal codes

    const reqConsumers = new Consumers({
      name: consumerDetails.name,
      emailId: consumerDetails.emailId,
      pwd: hash,
      phoneNO: consumerDetails.phoneNO,
      address: consumerDetails.address,
      zipCode: consumerDetails.zipCode,
      coins: 200,
      referals: {
        referalCode: generateReferCode,
      },
    });

    const savedconsumers = await reqConsumers.save(); // saving to the database

    //checking referals
    if (referedBy !== "") {
      await Consumers.findByIdAndUpdate(
        savedconsumers._id,
        { $set: { "referals.referedBy": referedBy }, upsert: true },
        { new: true }
      );
    }
    await referedPersons(referedValue, res, savedconsumers);
    res.status(200).send("registered successfully");
  } catch (err) {
    console.log(err); //error handlors
    res.status(400).send(err.message);
  }
});

//login consumers
routers.post("/login", async (req, res) => {
  const { error } = consumerValidator(req.body);
  if (error) {
    res.status(400).send(error.details[0].message);
    return;
  }
  const verifyingUser = await Consumers.findOne({ emailId: req.body.emailId });
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
    res.status(200).header({ auth_token: token }).json({ auth_token: token });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

//update consumers
routers.put("/update/:id", verifyTokenUser, async (req, res) => {
  const { error } = consumerValidator(req.body);
  if (error) {
    res.status(400).send(error.details[0].message);
    return;
  }
  const ID = req.params.id;
  const updateData = req.body;
  const update = await Consumers.findByIdAndUpdate(ID, updateData, {
    new: true,
  });
  res.status(200).send("updated successfully!!");
});

// update referals

//random referals genraters
function generateUID() {
  // I generate the UID from two parts here
  // to ensure the random number provide enough bits.
  var firstPart = (Math.random() * 46656) | 0;
  var secondPart = (Math.random() * 46656) | 0;
  firstPart = ("000" + firstPart.toString(36)).slice(-3);
  secondPart = ("000" + secondPart.toString(36)).slice(-3);
  return firstPart + secondPart;
}

//checking referals codes
const generatingReferalCode = async () => {
  const generatedCode = await generateUID();
  const checkingCode = await Consumers.findOne({
    "referals.referalCode": generatedCode,
  });
  if (checkingCode) {
    checkingReferalCode();
    return;
  }
  return generatedCode;
};

//updating details for referedPersons
const referedPersons = async (referedValue, res, reg_userID) => {
  //   console.log(referedValue);
  if (referedValue !== "" && referedValue !== undefined) {
    const referedBy = await Consumers.findOne({
      "referals.referalCode": referedValue,
    });
    if (referedBy) {
      const ID = referedBy._id;
      //   console.log(reg_userID._id);
      await Consumers.findByIdAndUpdate(
        ID,
        {
          $push: {
            "referals.referalsMembers": [reg_userID._id],
          },
          $inc: {
            coins: process.env.INC_REFERAL_COINS,
          },
        },
        { upsert: true }
      );
      return ID;
    }
    return res.status(400).send("invaild referedPersons code");
  }
};

//checking referals by
const checkingReferals = async (referedValue, res) => {
  //   console.log(data.referals.referedBy);
  if (referedValue !== "" && referedValue !== undefined) {
    const referedBy = await Consumers.findOne({
      "referals.referalCode": referedValue,
    });
    if (referedBy) {
      return referedBy._id;
    }
    return res.status(400).send("invaild referal code");
  }
  return "";
};

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

module.exports = routers;
