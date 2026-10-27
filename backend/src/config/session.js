const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { pool } = require('./db');

const sessionConfig = session({
  store: new pgSession({
    pool: pool,
    tableName: 'dmi_sessions',
    createTableIfMissing: false,
  }),
  secret: process.env.SESSION_SECRET || 'default_fallback_secret_key',
  resave: false,
  saveUninitialized: false,
  name: 'dmi.sid',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
});

module.exports = sessionConfig;