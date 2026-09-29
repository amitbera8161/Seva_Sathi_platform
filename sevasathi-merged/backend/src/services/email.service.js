const nodemailer = require('nodemailer');
const config = require('../config/env');

// Two supported email delivery methods, auto-selected based on what's
// configured in .env:
//
//  1. Gmail OAuth2 — used if GMAIL_USER + GMAIL_OAUTH_CLIENT_ID +
//     GMAIL_OAUTH_CLIENT_SECRET + GMAIL_OAUTH_REFRESH_TOKEN are all set.
//  2. Generic SMTP — used if SMTP_HOST + SMTP_USER + SMTP_PASS are set
//     instead. Works with SendGrid, AWS SES, Mailgun, or Gmail App
//     Password SMTP.
//
// If neither is configured: throws in production, falls back to
// console-logging the email in development so local testing still works.

let transporter = null;

function buildTransporter() {
  const hasOAuth2 =
    config.GMAIL_USER &&
    config.GMAIL_OAUTH_CLIENT_ID &&
    config.GMAIL_OAUTH_CLIENT_SECRET &&
    config.GMAIL_OAUTH_REFRESH_TOKEN;

  if (hasOAuth2) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: config.GMAIL_USER,
        clientId: config.GMAIL_OAUTH_CLIENT_ID,
        clientSecret: config.GMAIL_OAUTH_CLIENT_SECRET,
        refreshToken: config.GMAIL_OAUTH_REFRESH_TOKEN,
      },
    });
  }

  const hasSmtp = config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS;
  if (hasSmtp) {
    return nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_SECURE,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
      },
    });
  }

  return null; // not configured
}

function getTransporter() {
  if (transporter) return transporter;
  transporter = buildTransporter();
  return transporter;
}

/**
 * Sends an email. Throws on failure so callers (e.g. signup/OTP flows)
 * can decide how to respond to the user rather than silently swallowing
 * a delivery failure.
 */
async function sendEmail(to, subject, body) {
  const activeTransporter = getTransporter();

  if (!activeTransporter) {
    if (config.NODE_ENV === 'production') {
      // Should be unreachable — env.js already validates this at startup —
      // but guard against misconfiguration anyway.
      throw new Error('Email service is not configured (set GMAIL_OAUTH_* or SMTP_* environment variables)');
    }

    // Local/dev fallback: nothing configured, so just log instead of
    // failing every signup/OTP flow during development.
    console.log(`[email.service] (dev fallback, no email provider configured) To: ${to} | Subject: ${subject}`);
    console.log(`[email.service] Body: ${body}`);
    return;
  }

  const from = config.GMAIL_USER
    ? `SevaSathi <${config.GMAIL_USER}>`
    : config.EMAIL_FROM || config.SMTP_USER;

  try {
    const info = await activeTransporter.sendMail({
      from,
      to,
      subject,
      text: body,
    });
    console.log(`[email.service] Email sent to ${to} (messageId: ${info.messageId})`);
  } catch (err) {
    console.error(`[email.service] Failed to send email to ${to}:`, err.message);
    throw err;
  }
}

module.exports = { sendEmail };
