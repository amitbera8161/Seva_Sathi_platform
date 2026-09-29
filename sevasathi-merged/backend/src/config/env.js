const dotenv = require('dotenv');
dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';

const required = ['MONGO_URI', 'JWT_SECRET'];

// In production, real email delivery is mandatory — the app must fail fast
// at startup rather than silently falling back to console-logging OTPs.
// Either the OAuth2 Gmail path OR the generic SMTP path must be fully
// configured (checked in code below, not in this static list, since it's
// an either/or requirement).
if (NODE_ENV === 'production') {
  required.push('MONGO_URI', 'JWT_SECRET');
}

const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

const config = {
  PORT: process.env.PORT || 3000,
  NODE_ENV,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',

  // ---- Email: Gmail OAuth2 (preferred if these are set) ----
  GMAIL_USER: process.env.GMAIL_USER || '',
  GMAIL_OAUTH_CLIENT_ID: process.env.GMAIL_OAUTH_CLIENT_ID || '',
  GMAIL_OAUTH_CLIENT_SECRET: process.env.GMAIL_OAUTH_CLIENT_SECRET || '',
  GMAIL_OAUTH_REFRESH_TOKEN: process.env.GMAIL_OAUTH_REFRESH_TOKEN || '',

  // ---- Email: generic SMTP (fallback if OAuth2 vars above aren't set) ----
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
  SMTP_SECURE: process.env.SMTP_SECURE === 'true', // true for port 465, false for 587/25
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || '',
};

// In production, one full email path (OAuth2 or SMTP) must be configured.
if (NODE_ENV === 'production') {
  const hasOAuth2 =
    config.GMAIL_USER && config.GMAIL_OAUTH_CLIENT_ID && config.GMAIL_OAUTH_CLIENT_SECRET && config.GMAIL_OAUTH_REFRESH_TOKEN;
  const hasSmtp = config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS && config.EMAIL_FROM;

  if (!hasOAuth2 && !hasSmtp) {
    throw new Error(
      'No email delivery method configured. Set either the GMAIL_OAUTH_* variables or the SMTP_* variables before running in production.'
    );
  }
}

module.exports = config;
