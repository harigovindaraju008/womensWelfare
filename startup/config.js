module.exports = function () {
  if (!process.env.SECRET_KEY) {
    throw new Error("FATAL ERROR: jwtPrivateKey is not defined.");
  }
};
