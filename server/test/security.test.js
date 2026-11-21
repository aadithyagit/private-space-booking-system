const test = require('node:test');
const { describe, it } = test;
const assert = require('node:assert/strict');
const { createRateLimiter, securityHeaders } = require('../middleware/security');

describe('Security Middleware Suite', () => {
  describe('securityHeaders', () => {
    it('sets protective HTTP security headers', () => {
      const headers = {};
      const req = {};
      const res = {
        setHeader(name, val) {
          headers[name] = val;
        }
      };
      let nextCalled = false;
      securityHeaders(req, res, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, true);
      assert.strictEqual(headers['X-Content-Type-Options'], 'nosniff');
      assert.strictEqual(headers['X-Frame-Options'], 'DENY');
      assert.strictEqual(headers['X-XSS-Protection'], '1; mode=block');
      assert.strictEqual(headers['Referrer-Policy'], 'strict-origin-when-cross-origin');
    });
  });

  describe('createRateLimiter', () => {
    it('allows requests within limit and sets rate limit headers', () => {
      const limiter = createRateLimiter({ max: 3, windowMs: 10000 });
      const req = { ip: '127.0.0.1' };
      const headers = {};
      const res = {
        setHeader(name, val) {
          headers[name] = val;
        }
      };
      let nextCount = 0;
      const next = () => { nextCount++; };

      limiter(req, res, next);
      assert.strictEqual(nextCount, 1);
      assert.strictEqual(headers['X-RateLimit-Limit'], 3);
      assert.strictEqual(headers['X-RateLimit-Remaining'], 2);

      limiter(req, res, next);
      assert.strictEqual(nextCount, 2);
      assert.strictEqual(headers['X-RateLimit-Remaining'], 1);
    });

    it('blocks requests exceeding maximum threshold with HTTP 429', () => {
      const limiter = createRateLimiter({ max: 2, windowMs: 10000 });
      const req = { ip: '192.168.1.5' };
      let statusSent = null;
      let jsonSent = null;
      const res = {
        setHeader() {},
        status(code) {
          statusSent = code;
          return {
            json(payload) {
              jsonSent = payload;
            }
          };
        }
      };

      limiter(req, res, () => {});
      limiter(req, res, () => {});

      // 3rd request should trigger 429
      limiter(req, res, () => {
        assert.fail('Should not call next when rate limited');
      });

      assert.strictEqual(statusSent, 429);
      assert.ok(jsonSent.error.includes('Too many requests'));
    });
  });
});
