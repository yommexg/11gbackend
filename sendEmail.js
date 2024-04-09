const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "GMAIL",
  auth: {
    user: process.env.GMAIL,
    pass: process.env.GMAIL_PASSWORD,
  },
});

function sendMessage(email, title, message, color) {
  // Define email options
  const mailOptions = {
    from: "11G Autos",
    to: email,
    subject: "11G Autos",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>11G Autos OTP</title>
  <style>
    /* Styles for the email body */
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      padding: 20px;
      margin: 0;
    }
    /* Styles for the OTP container */
    .otp-container {
      background-color: #fff;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      padding: 20px;
      max-width: 400px;
      margin: auto;
    }
    /* Styles for the OTP text */
    .otp-text {
      font-size: 18px;
      margin-bottom: 20px;
    }
    /* Styles for the OTP code */
    .otp-code {
      font-size: 14px;
      font-weight: bold;
      color: ${color}; 
    }
    /* Styles for the footer */
    .footer {
      text-align: center;
      margin-top: 20px;
    }
    /* Styles for the company name */
    .company-name {
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="otp-container">
    <h2 class="company-name">${title}</h2>
    <p class="otp-code">${message}</p>
  </div>
  <div class="footer">
    <p>For any inquiries, please contact us at <a href="mailto:info@11gautos.com">info@11gautos.com</a></p>
  </div>
</body>
</html>
`,
  };

  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      //   console.log("Email sent:", info.response);
    }
  });
}

module.exports = {
  sendMessage,
};
