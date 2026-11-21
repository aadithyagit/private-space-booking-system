const test = require('node:test');
const { describe, it } = test;
const assert = require('node:assert/strict');
const { validateEmail, validateName, validateBookingDate } = require('../validation');

describe('Input Validation Suite', () => {
  describe('validateEmail', () => {
    it('rejects empty or whitespace-only emails', () => {
      assert.strictEqual(validateEmail(''), 'Email is required.');
      assert.strictEqual(validateEmail('   '), 'Email is required.');
      assert.strictEqual(validateEmail(null), 'Email is required.');
      assert.strictEqual(validateEmail(undefined), 'Email is required.');
    });

    it('rejects emails without @ or with multiple @ signs', () => {
      assert.strictEqual(validateEmail('plainaddress'), 'Invalid email format.');
      assert.strictEqual(validateEmail('user@@domain.com'), 'Invalid email format.');
      assert.strictEqual(validateEmail('user@name@domain.com'), 'Invalid email format.');
    });

    it('rejects invalid email structures and missing domains', () => {
      assert.strictEqual(validateEmail('user@domain'), 'Invalid email format.');
      assert.strictEqual(validateEmail('@domain.com'), 'Invalid email format.');
      assert.strictEqual(validateEmail('user@.com'), 'Invalid email format.');
    });

    it('accepts valid email addresses', () => {
      assert.strictEqual(validateEmail('user@example.com'), null);
      assert.strictEqual(validateEmail('john.doe+work@sub.company.org'), null);
      assert.strictEqual(validateEmail('aadhitari@gmail.com'), null);
    });
  });

  describe('validateName', () => {
    it('rejects empty or single character names', () => {
      assert.strictEqual(validateName(''), 'Name must be at least 2 characters.');
      assert.strictEqual(validateName('a'), 'Name must be at least 2 characters.');
      assert.strictEqual(validateName('   '), 'Name must be at least 2 characters.');
      assert.strictEqual(validateName(null), 'Name must be at least 2 characters.');
      assert.strictEqual(validateName(undefined), 'Name must be at least 2 characters.');
    });

    it('accepts valid names of 2 or more characters', () => {
      assert.strictEqual(validateName('Al'), null);
      assert.strictEqual(validateName('Aadithya Sreekaant'), null);
      assert.strictEqual(validateName('  Aadithya  '), null);
    });
  });

  describe('validateBookingDate', () => {
    it('rejects missing or unparseable dates', () => {
      assert.strictEqual(validateBookingDate(''), 'Booking date is required.');
      assert.strictEqual(validateBookingDate(null), 'Booking date is required.');
      assert.strictEqual(validateBookingDate('not-a-valid-date'), 'Invalid date.');
    });

    it('rejects past dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yyyy = yesterday.getFullYear();
      const mm = String(yesterday.getMonth() + 1).padStart(2, '0');
      const dd = String(yesterday.getDate()).padStart(2, '0');
      const formatted = `${yyyy}-${mm}-${dd}`;

      assert.strictEqual(validateBookingDate(formatted), 'Invalid date. Please select a future date.');
    });

    it('allows booking today or in the near future', () => {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const todayFormatted = `${yyyy}-${mm}-${dd}`;

      assert.strictEqual(validateBookingDate(todayFormatted), null);

      const inTwoWeeks = new Date();
      inTwoWeeks.setDate(inTwoWeeks.getDate() + 14);
      const yyyy2 = inTwoWeeks.getFullYear();
      const mm2 = String(inTwoWeeks.getMonth() + 1).padStart(2, '0');
      const dd2 = String(inTwoWeeks.getDate()).padStart(2, '0');
      const twoWeeksFormatted = `${yyyy2}-${mm2}-${dd2}`;

      assert.strictEqual(validateBookingDate(twoWeeksFormatted), null);
    });

    it('rejects bookings beyond 1 month in advance', () => {
      const farFuture = new Date();
      farFuture.setMonth(farFuture.getMonth() + 2);
      const yyyy = farFuture.getFullYear();
      const mm = String(farFuture.getMonth() + 1).padStart(2, '0');
      const dd = String(farFuture.getDate()).padStart(2, '0');
      const formatted = `${yyyy}-${mm}-${dd}`;

      assert.strictEqual(validateBookingDate(formatted), 'Booking allowed only up to 1 month in advance.');
    });
  });
});
