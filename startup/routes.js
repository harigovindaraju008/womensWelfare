const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
//customs
const consumers = require("../routers/consumersRouters");
const serviceProviders = require("../routers/serviceProvidersRouters");
const admin = require("../routers/adminRouters");
const error = require("../middlewares/error");
require("dotenv").config();

module.exports = function (app) {
  app.use(cors());
  app.use(express.json());
  app.use(fileUpload());
  //routers
  app.use("/api/consumers", consumers);
  app.use("/api/serviceProviders", serviceProviders);
  app.use("/api/admin", admin);
  app.use(error);
};
