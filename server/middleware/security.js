// middleware/security.js — Security headers and rate limiting

/**
 * Basic in-memory rate limiter middleware
 * @param {object} options
 * @param {number} options.windowMs - Time window in milliseconds (default 15 mins)
 * @param {number} options.max - Max requests per window per IP (default 100)
 * @param {string} options.message - Error message
 */
function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || 15 * 60 * 1000;
  const max = options.max || 100;
  const message = options.message || 'Too many requests, please try again later.';
  const hits = new Map();

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const clientRecord = hits.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > clientRecord.resetTime) {
      clientRecord.count = 1;
      clientRecord.resetTime = now + windowMs;
    } else {
      clientRecord.count += 1;
    }

    hits.set(ip, clientRecord);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - clientRecord.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(clientRecord.resetTime / 1000));

    if (clientRecord.count > max) {
      return res.status(429).json({ error: message });
    }

    next();
  };
}

/**
 * Standard security response headers middleware
 */
function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
}

module.exports = { createRateLimiter, securityHeaders };
