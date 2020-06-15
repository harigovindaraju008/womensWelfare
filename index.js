//npm installs
const cors = require("cors");
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyPaser = require("body-parser");
const fileUpload = require("express-fileupload");
const path = require("path");

//customs
const consumers = require("./routers/consumersRouters");
const serviceProviders = require("./routers/serviceProvidersRouters");
const admin = require("./routers/adminRouters");

//configuration
require("dotenv").config();
app.use(cors());
app.use(bodyPaser.json());
app.use(bodyPaser.urlencoded({ extended: true }));
app.use(fileUpload());

//routers
app.use("/api/consumers", consumers);
app.use("/api/serviceProviders", serviceProviders);
app.use("/api/admin", admin);

//mongodb connection
const port = process.env.PORT || 4001;
const mongoDBUrl = process.env.MONGODB_URL;
mongoose.set("useCreateIndex", true);
mongoose
  .connect(mongoDBUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log("mongodb connected succesfully");
    app.listen(port, () => console.log(`backend is listening on port ${port}`));
  })
  .catch((error) => {
    console.log("error connection to MongoDB:", error.message);
  });
