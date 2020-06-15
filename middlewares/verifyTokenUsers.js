const jwt = require("jsonwebtoken");
const Consumer = require("../models/consumer");

module.exports = async function verifyToken(req, res, next) {
  const token = req.header("auth_token");
  const SecretKey = process.env.SECRET_KEY;
  // for developer purpose to testing
  //  const tokens = jwt.sign("hariharan@gmail.com", SecretKey);
  //  console.log(tokens);
  if (!token) {
    return res.status(403).send("Access-Denied ");
  }
  try {
    // req.key = SecretKey;
    const { emailId } = jwt.verify(token, SecretKey);
    req.emailId = emailId;
    const verify = await Consumer.findOne({ emailId: emailId });
    if (!verify) {
      res.status(400).send("invalid Access");
      return;
    }
    next();
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
};
