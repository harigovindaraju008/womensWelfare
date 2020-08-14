//custom imports
const {
  ServiceProviders,
  validateServiceProviders,
} = require("../models/serviceProviders");
const validate = require("../middlewares/validate");
const verifyProviders = require("../middlewares/verifyTokenProviders");
const verifyUserToken = require("../middlewares/verifyTokenUsers");
const { saveImage, loadImage } = require("../utils/imageProcess");
const validateObjectId = require("../middlewares/validateObjectId");

//npm packages
const express = require("express");
const routers = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

//geting all services Providers
routers.get("/", verifyUserToken, async (req, res) => {
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
routers.get("/:id/providerImage", async (req, res) => {
  const serviceProviderId = req.params.id;
  loadImage("serviceProviders.image", serviceProviderId, res);
});

routers.get("/:fileName/providerWorkImage", async (req, res) => {
  const serviceProviderWorkName = req.params.fileName;
  loadImage("serviceProviders.works.image", serviceProviderWorkName, res);
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
routers.post(
  "/register",
  [validate(validateServiceProviders)],
  async (req, res) => {
    if (!req.files) {
      return res.status(400).send("invalid Photo value ");
    }

    const { isError, message } = await imageValidationObject(
      req.files.serviceProviderImage
    );
    if (isError) {
      return res.status(400).send(message);
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
  }
);

//login seviceProviders
routers.post(
  "/login",
  [validate(validateServiceProviders)],
  async (req, res) => {
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
  }
);

//adding workers
routers.post(
  "/addworkers",
  [verifyProviders, validate(validateServiceProviders)],
  async (req, res) => {
    const value = req.body;

    const checkingTitle = await ServiceProviders.findOne({
      "works.title": value.works.title,
    });
    if (checkingTitle) return res.status(400).send("Title must not be same!!");

    try {
      const updateServiceProvider = await ServiceProviders.findByIdAndUpdate(
        value.id,
        {
          $push: { works: [value.works] },
        },
        {
          new: true,
        }
      );
      // console.log(updateServiceProvider);
      if (updateServiceProvider) {
        let Response = {
          messeage: "work Added!!",
          workID: "",
        };
        await updateServiceProvider.works.filter((e) => {
          if (e.title === value.works.title) {
            Response.workID = e._id;
            return e._id;
          }
        });
        return res.status(200).send(Response);
      } else {
        res.status(400).send("invalid ID");
      }
    } catch (err) {
      console.log(err);
      res.status(400).send(err.message);
    }
  }
);

//adding images for workers

routers.put("/addWorkPic/:id", async (req, res) => {
  const { isError, message, files, id } = await imageValidation(
    req.files,
    req.params.id
  );
  if (isError) {
    return res.status(400).send(message);
  }

  let allfileNames = [];
  files.images.map(async (img, index) => {
    let fileName = "" + id + "-" + (index + 1);
    allfileNames.push(fileName);
    await saveImage("serviceProviders.works.image", img, fileName);
    if (index + 1 === files.images.length)
      try {
        await ServiceProviders.findOneAndUpdate(
          { "works._id": id },
          {
            "works.$.images": allfileNames,
          }
        );
        res.status(200).send("images is successfully updated");
      } catch (err) {
        console.log(err);
        res.status(400).send(err.message);
      }
  });
});

// routers.put("/updateWorkPic/:id/:filename", async (req, res) => {
//   const { isError, message, files, id } = await imageValidation(
//     req.files,
//     req.params.id,
//     req.params.filename
//   );
//   if (isError) {
//     return res.status(400).send(message);
//   }
//   await saveImage("serviceProviders.works.image", img, fileName);
//   res.status(200).send("images is successfully updated");
// });

//adding reviews
routers.post(
  "/userReview",
  [verifyUserToken, validate(validateServiceProviders)],
  async (req, res) => {
    // const { error, value } = validateServiceProviders(req.body);
    // if (error) {
    //   res.status(400).send(error.details[0].message);
    //   return;
    // }
    const value = req.body;
    const checkingWorkID = mongoose.Types.ObjectId.isValid(value.id.toString());
    const checkingConsumerID = mongoose.Types.ObjectId.isValid(
      value.reviews.userID.toString()
    );

    if ((checkingWorkID && checkingConsumerID) !== true) {
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
      console.log(err.message);
      res.status(400).send(err.message);
    }
  }
);

//adding compliant
routers.post(
  "/userCompliant",
  [verifyUserToken, validate(validateServiceProviders)],
  async (req, res) => {
    const value = req.body;
    const checkingWorkID = mongoose.Types.ObjectId.isValid(value.id.toString());
    const checkingConsumerID = mongoose.Types.ObjectId.isValid(
      value.complaints.userID.toString()
    );
    if ((checkingWorkID && checkingConsumerID) !== true) {
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
  }
);
//updating service porviders details
routers.put(
  "/updateProvider/:id",
  [verifyProviders, validateObjectId, validate(validateServiceProviders)],
  async (req, res) => {
    const value = req.body;
    const updateProvider = await ServiceProviders.findByIdAndUpdate(
      req.params.id,
      value
    );
    if (updateProvider) {
      res.status(200).send("successfully updated");
    } else {
      res.status(400).send("Invalid Provider Id");
    }
  }
);

routers.put("/updateProviderPic/:id", async (req, res) => {
  if (!req.files) {
    return res.status(400).send("invalid key value ");
  }
  const { isError, message } = await imageValidationObject(
    req.files.serviceProviderImage,
    req.params.id
  );
  if (isError) {
    return res.status(400).send(message);
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

routers.post(
  "/hiringReq",
  [verifyProviders, validate(validateServiceProviders)],
  async (req, res) => {
    const value = req.body;
    const checkingTitle = await ServiceProviders.findOne({
      "jobs.title": value.jobs.title,
    });
    if (checkingTitle) return res.status(400).send("Title must not be same!!");

    try {
      const updateServiceProvider = await ServiceProviders.findByIdAndUpdate(
        value.id,
        {
          $push: { jobs: [value.jobs] },
        }
      );
      // console.log(updateServiceProvider);
      if (updateServiceProvider) {
        return res.status(200).send("job Added!!");
      } else {
        res.status(400).send("invalid ID");
      }
    } catch (err) {
      console.log(err);
      res.status(400).send(err.message);
    }
  }
);

//image validation

const imageValidation = (files, id) => {
  let errors = {
    isError: true,
    message: "",
    files,
    id,
  };

  const checkingWorkID = mongoose.Types.ObjectId.isValid(id.toString());
  if (checkingWorkID !== true) {
    errors.message = "invalid userID or WorkID";
    return errors;
  }

  // console.log(files, id);
  if (!files) {
    errors.message = "Please upload atleast only two images.";
    return errors;
  }

  const file = files.images;
  // console.log(file.length);
  if (!file || file.length <= 1 || file.length === undefined) {
    errors.message = "Please upload atleast only two images.";
    return errors;
  } else if (file.length > 3) {
    errors.message = "Please upload  only three images.";
    return errors;
  }

  const checkIsImg = file.find((img) => !img.mimetype.startsWith("image"));
  if (checkIsImg) {
    errors.message = "Not an image! Please upload only images.";
    return errors;
  }

  const checkImgSize = file.find(({ size }) => size >= 1024 * 1024 * 2);
  if (checkImgSize) {
    errors.message = "Too large image! Please upload below 2 mb each images.";
    return errors;
  }
  errors.isError = false;
  return errors;
};

const imageValidationObject = (files, id) => {
  let errors = {
    isError: true,
    message: "",
    files,
    id,
  };

  if (id) {
    const checkingWorkID = mongoose.Types.ObjectId.isValid(id.toString());
    if (checkingWorkID !== true) {
      errors.message = "invalid userID or WorkID";
      return errors;
    }
  }

  // console.log(files, id);
  if (!files) {
    errors.message = "Please upload  images.";
    return errors;
  }

  const file = files;
  // console.log(file.length);
  if (!file || file === undefined || file === null) {
    errors.message = "Please upload  images.";
    return errors;
  }

  const checkIsImg = file.mimetype.startsWith("image");
  if (!checkIsImg) {
    errors.message = "Not an image! Please upload only images.";
    return errors;
  }

  const checkImgSize = file.size >= 1024 * 1024 * 2;
  if (checkImgSize) {
    errors.message = "Too large image! Please upload below 2 mb each images.";
    return errors;
  }
  errors.isError = false;
  return errors;
};

module.exports = routers; //exporting models
