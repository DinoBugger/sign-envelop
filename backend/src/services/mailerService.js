import nodemailer from "nodemailer";
import { getTrimmedEnv } from "../utils/env.js";

const emailUser = getTrimmedEnv("EMAIL_USER");
const emailPass = getTrimmedEnv("EMAIL_PASS");
const smtpService = getTrimmedEnv("SMTP_SERVICE");
const defaultFromEmail = getTrimmedEnv("EMAIL_FROM", emailUser || "no-reply@example.com");
const defaultFromName = getTrimmedEnv("EMAIL_FROM_NAME", "Node Auth System");

const configured = Boolean(emailUser && emailPass);

let transporter = null;
if (configured) {
  const host = getTrimmedEnv("SMTP_HOST", "smtp.gmail.com");
  const port = Number(getTrimmedEnv("SMTP_PORT") || 587);
  const secure = false; // TLS upgrade via STARTTLS on port 587

  const transportOptions = {
    host,
    port,
    secure,
    auth: { user: emailUser, pass: emailPass },
  };

  transporter = nodemailer.createTransport(transportOptions);
}

const getFromAddress = () => `${defaultFromName} <${defaultFromEmail}>`;

const formatRecipient = (recipient) => {
  if (typeof recipient === "string") {
    const email = recipient.trim();
    if (!email) throw new Error("Recipient email cannot be empty.");
    return email;
  }

  if (typeof recipient === "object" && recipient !== null) {
    const email = typeof recipient.email === "string" ? recipient.email.trim() : "";
    const name = typeof recipient.name === "string" ? recipient.name.trim() : "";
    if (!email) throw new Error("Recipient email is required.");
    return name ? `${name} <${email}>` : email;
  }

  throw new Error("Recipient must be a string or an object with email and optional name.");
};

export const sendMail = async ({ to, subject, html, text }) => {
  if (!transporter) {
    return {
      skipped: true,
      message: "Email sending is not configured. Something is off with nodemailer configuration.",
    };
  }

  if (!subject?.trim()) {
    throw new Error("Email subject is required.");
  }

  const recipient = formatRecipient(to);

  const mailOptions = {
    from: getFromAddress(),
    to: recipient,
    subject: subject.trim(),
  };

  if (typeof html === "string" && html.trim()) mailOptions.html = html;
  if (typeof text === "string" && text.trim()) mailOptions.text = text;

  const info = await transporter.sendMail(mailOptions);

  console.log(`✓ Email sent successfully to ${recipient} (Subject: "${subject}")`);
  return info;
};

export const sendWelcomeEmail = async (user) => {
  if (!user?.email) {
    return { skipped: true, message: "User email is missing." };
  }

  return sendMail({
    to: { name: user.username || user.email, email: user.email },
    subject: "Welcome to Node Auth System",
    html: `<h1>Welcome, ${user.username || "there"}!</h1><p>Your account has been created successfully.</p>`,
    text: `Welcome, ${user.username || "there"}! Your account has been created successfully.`,
  });
};

export const sendOtpEmail = async ({ email, otpCode, actionType = "REGISTER" }) => {
  const subject = actionType === "RESET_PASSWORD" ? "Your password reset code" : "Your verification code";

  return sendMail({
    to: email,
    subject,
    html: `<p>Your verification code is <strong>${otpCode}</strong>.</p><p>This code will expire soon.</p>`,
    text: `Your verification code is ${otpCode}. This code will expire soon.`,
  });
};

export const sendMailStatus = () => ({
  configured,
  fromEmail: defaultFromEmail,
  fromName: defaultFromName,
});
