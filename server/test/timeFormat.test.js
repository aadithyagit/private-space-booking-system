const test = require('node:test');
const { describe, it } = test;
const assert = require('node:assert/strict');
const { to12Hr, calculateAvailability } = require('../utils/timeFormat');

describe('Time and Availability Utilities', () => {
  describe('to12Hr', () => {
    it('formats morning times correctly', () => {
      assert.strictEqual(to12Hr('09:00'), '9:00 AM');
      assert.strictEqual(to12Hr('09:30:00'), '9:30 AM');
      assert.strictEqual(to12Hr('00:00'), '12:00 AM');
      assert.strictEqual(to12Hr('11:45'), '11:45 AM');
    });

    it('formats afternoon and evening times correctly', () => {
      assert.strictEqual(to12Hr('12:00'), '12:00 PM');
      assert.strictEqual(to12Hr('13:00'), '1:00 PM');
      assert.strictEqual(to12Hr('18:30:00'), '6:30 PM');
      assert.strictEqual(to12Hr('23:59'), '11:59 PM');
    });

    it('handles empty and malformed inputs gracefully', () => {
      assert.strictEqual(to12Hr(''), '');
      assert.strictEqual(to12Hr(null), '');
      assert.strictEqual(to12Hr(undefined), '');
      assert.strictEqual(to12Hr('invalid'), 'invalid');
    });
  });

  describe('calculateAvailability', () => {
    it('calculates remaining spots when below capacity', () => {
      const res = calculateAvailability(30, 10);
      assert.strictEqual(res.spotsLeft, 20);
      assert.strictEqual(res.isAvailable, true);
    });

    it('reports zero spots and unavailable when full', () => {
      const res = calculateAvailability(30, 30);
      assert.strictEqual(res.spotsLeft, 0);
      assert.strictEqual(res.isAvailable, false);
    });

    it('clamps negative spots to zero if overbooked', () => {
      const res = calculateAvailability(30, 35);
      assert.strictEqual(res.spotsLeft, 0);
      assert.strictEqual(res.isAvailable, false);
    });

    it('handles edge case inputs with defaults', () => {
      const res = calculateAvailability(null, null);
      assert.strictEqual(res.spotsLeft, 0);
      assert.strictEqual(res.isAvailable, false);
    });
  });
});
