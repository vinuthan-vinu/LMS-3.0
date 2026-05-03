const rateLimit = require('express-rate-limit');

/** Brute-force protection for login/register */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX || 60),
  message: { success: false, message: 'Too many authentication attempts — try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Softer ceiling for noisy chat / message endpoints (optional reuse) */
const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.CHAT_RATE_LIMIT_MAX || 40),
  message: { success: false, message: 'Too many requests — slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, messageLimiter };
