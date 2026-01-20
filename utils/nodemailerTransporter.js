const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465, // secure port
  secure: true, // use TLS
  auth: {
    user: "addalamanikanta1232@gmail.com", // your Gmail address
    pass: "qcka ybjj prex ltyx", // Gmail App Password
  },
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

transporter.verify((err, success) => {
  if (err) {
    console.error("SMTP Connection Error:", err);
  } else {
    console.log("SMTP Server is ready to take messages");
  }
});

module.exports = transporter;
