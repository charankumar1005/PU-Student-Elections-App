const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // important for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 60000,
  socketTimeout: 60000,
});
// Important file to sent otp

const sendOTP = async (email, otp) => {
  try {
    let info = await transporter.sendMail({
      from: `"Pondicherry University Elections" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Email Verification OTP",
      text: `Your OTP for verification is: ${otp}`,
      html: `<p>Your OTP for email verification is: <strong>${otp}</strong></p>`,
    });
    console.log("OTP sent successfully:", info.response);
    return { success: true, message: "OTP sent successfully" };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, message: "Failed to send OTP", error };
  }
};

module.exports = sendOTP;

