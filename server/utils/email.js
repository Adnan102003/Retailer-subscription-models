const nodemailer = require("nodemailer");

const hasSmtpConfig =
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS &&
  process.env.SMTP_FROM &&
  !String(process.env.SMTP_USER).includes("your_email") &&
  !String(process.env.SMTP_PASS).includes("your_smtp_password");

const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: String(process.env.SMTP_SECURE) === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  : null;

const sendEmail = async (payload) => {
  if (!transporter) {
    throw new Error("SMTP is not configured. Set SMTP_USER/SMTP_PASS/SMTP_FROM in server .env");
  }
  await transporter.sendMail(payload);
};

const sendApprovalEmail = async (toEmail, name, username, password) => {
  await sendEmail({
    from: process.env.SMTP_FROM,
    to: toEmail,
    subject: "Account Approved - Login Credentials",
    html: `
      <h2>Hi ${name},</h2>
      <p>Your payment has been reviewed and approved by admin.</p>
      <p>Use the following credentials to sign in:</p>
      <p><strong>Username:</strong> ${username}</p>
      <p><strong>Password:</strong> ${password}</p>
      <p>Please change your password after your first login.</p>
      <p>Thanks,<br/>SRMS Team</p>
    `
  });
};

const sendOtpEmail = async (toEmail, name, otpCode) => {
  await sendEmail({
    from: process.env.SMTP_FROM,
    to: toEmail,
    subject: "Email Verification OTP",
    html: `
      <h2>Hi ${name},</h2>
      <p>Your email verification OTP is:</p>
      <h3>${otpCode}</h3>
      <p>This OTP is valid for 10 minutes.</p>
    `
  });
};

const sendPhoneOtpFallbackEmail = async (toEmail, name, otpCode) => {
  await sendEmail({
    from: process.env.SMTP_FROM,
    to: toEmail,
    subject: "Phone Verification OTP (Fallback)",
    html: `
      <h2>Hi ${name},</h2>
      <p>SMS gateway unavailable, so your phone verification OTP is shared on email:</p>
      <h3>${otpCode}</h3>
      <p>This OTP is valid for 10 minutes.</p>
    `
  });
};

module.exports = { sendApprovalEmail, sendOtpEmail, sendPhoneOtpFallbackEmail, hasSmtpConfig };

