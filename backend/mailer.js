const nodemailer = require("nodemailer");
require("dotenv").config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // TLS with STARTTLS for port 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Should be App Password for Gmail
  },
  tls: {
    rejectUnauthorized: true, // more strict (improves security)
  },
  connectionTimeout: 60000, // 60 seconds
  socketTimeout: 60000,
});

// Function to send OTP email
const sendOTP = async (email, otp) => {
  try {
    const mailOptions = {
      from: `"Pondicherry University Elections" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🔒 Email Verification OTP - Pondicherry University Elections",
      text: `Your One-Time Password (OTP) is: ${otp}. Please use it within 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="text-align: center; color: #0047AB;">Pondicherry University Elections</h2>
          <p>Dear Student,</p>
          <p>Thank you for participating in the Pondicherry University Elections process.</p>
          <p><strong>Your One-Time Password (OTP) is:</strong></p>
          <div style="font-size: 24px; font-weight: bold; text-align: center; background-color: #f0f0f0; padding: 10px; border-radius: 8px;">
            ${otp}
          </div>
          <p style="margin-top: 20px;">This OTP is valid for <strong>10 minutes</strong>. Please do not share this OTP with anyone.</p>
          <p>If you did not request this verification, please ignore this email.</p>
          <hr />
          <p style="font-size: 12px; color: #888;">This is an automated message. Please do not reply to this email.</p>
          <p style="font-size: 12px; color: #888;">Pondicherry University © ${new Date().getFullYear()}</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ OTP email sent successfully:", info.response);
    return { success: true, message: "OTP sent successfully" };
  } catch (error) {
    console.error("❌ Error sending OTP email:", error);
    return { success: false, message: "Failed to send OTP", error };
  }
};

module.exports = sendOTP;
