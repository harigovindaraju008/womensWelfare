const nodemailer = require("nodemailer");
const ejs = require("ejs");

module.exports = async function sendMail(output, subject, userEmail, purpose) {
  let sent = false;
  let transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER, // generated ethereal user
      pass: process.env.EMAIL_PASS,
    },
  });
  try {
    if (purpose === "otpVerification") {
      ejs.renderFile(
        __dirname + "/templates/verifyOtp.ejs",
        { output: output },
        async (err, data) => {
          if (err) {
            console.log(err);
          } else {
            sent = true;
            let info = await transporter.sendMail({
              from: '"Womens Welfare" <' + process.env.EMAIL_USER + ">", // sender address
              to: [userEmail], // list of receivers
              subject: subject, // Subject line
              text: subject, // plain text body
              html: data, // html body
            });
            //console.log("Message sent: %s", info.messageId);
          }
        }
      );
    }
  } catch (err) {
    console.log(err.message);
  }
  return sent;
};
