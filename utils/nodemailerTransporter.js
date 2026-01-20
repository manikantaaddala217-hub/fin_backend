// const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 465, // secure port
//   secure: true, // use TLS
//   auth: {
//     user: "addalamanikanta1232@gmail.com", // your Gmail address
//     pass: "qcka ybjj prex ltyx", // Gmail App Password
//   },
//   connectionTimeout: 10000, // 10 seconds
//   greetingTimeout: 10000,
//   socketTimeout: 10000,
// });

// transporter.verify((err, success) => {
//   if (err) {
//     console.error("SMTP Connection Error:", err);
//   } else {
//     console.log("SMTP Server is ready to take messages");
//   }
// });

// module.exports = transporter;
const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 465, // secure port
//   secure: true, // use TLS
//   auth: {
//     user: "addalamanikanta1232@gmail.com", // your Gmail address
//     pass: "qcka ybjj prex ltyx", // Gmail App Password
//   },
//   connectionTimeout: 10000, // 10 seconds
//   greetingTimeout: 10000,
//   socketTimeout: 10000,
// });

// transporter.verify((err, success) => {
//   if (err) {
//     console.error("SMTP Connection Error:", err);
//   } else {
//     console.log("SMTP Server is ready to take messages");
//   }
// });


const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false, // TLS
  auth: {
    user: "a067f1001@smtp-brevo.com", // your login
    pass:"xsmtpsib-6dadf8943ee111f689539f39bc7a97037bd3dfd7acb78a6aec56e18f6642f880-y5P39OxCiAgEMvHt", // your SMTP/API key
  },
});


module.exports = transporter;

