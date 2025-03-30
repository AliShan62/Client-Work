const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cookieParser());

// ✅ Improved CORS Setup
app.use(
  cors({
    origin: ["https://client-frontend-wheat.vercel.app"], // Update with your frontend URL
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"], // Explicitly allow necessary methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allow necessary headers
  })
);

// ✅ Handle Preflight Requests (Important for Vercel)
app.options("*", cors());

app.get("/", (req, res) => {
  res.send("Hello World");
});

// Function to generate a random session ID
const generateRandomSessionID = () =>
  Math.random().toString(36).substring(2, 15) +
  Math.random().toString(36).substring(2, 15);

// Email configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.APP_PASSWORD,
  },
});

app.post("/send-email", async (req, res) => {
  const { name, email } = req.body;
  let { user_session } = req.cookies;

  if (!user_session) {
    user_session = generateRandomSessionID();
    res.cookie("user_session", user_session, {
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      httpOnly: true,
      secure: true, // ✅ Secure only in production
      sameSite: "None",
    });
  }

  const emailHTML = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
      <h2 style="color: #4CAF50; text-align: center;">🔔 New User Credentials</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Session ID:</strong> <span style="color: #ff5722;">${user_session}</span></p>
      <p style="text-align: center; color: #888; font-size: 14px;">📧 This is an automated email.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Admin" <${process.env.ADMIN_EMAIL}>`,
      to: process.env.ADMIN_EMAIL,
      subject: "New User Credentials Received",
      html: emailHTML,
    });

    res.status(200).json({
      message: "✅ Email sent successfully!",
      sessionID: user_session,
    });
  } catch (error) {
    console.error("❌ Error sending email:", error);
    res.status(500).json({ message: "Failed to send email" });
  }
});

// Start the server
const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
