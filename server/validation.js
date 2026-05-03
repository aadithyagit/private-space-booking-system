// validation.js — All input validation
// Schema has NO password column — login is email-only

/**
 * Validate email strictly:
 * - Must not be empty
 * - Must contain exactly one @
 * - Must match user@domain.ext format
 */
function validateEmail(email) {
  if (!email || email.trim() === '') {
    return 'Email is required.';
  }
  const trimmed = email.trim();

  // Must contain exactly one @
  const atCount = (trimmed.match(/@/g) || []).length;
  if (atCount !== 1) return 'Invalid email format.';

  // Full format check
  const regex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  if (!regex.test(trimmed)) return 'Invalid email format.';

  // Domain must have a dot
  const domain = trimmed.split('@')[1];
  if (!domain || !domain.includes('.')) return 'Invalid email format.';

  return null; // null = valid
}

/**
 * Validate name — required
 */
function validateName(name) {
  if (!name || name.trim().length < 2) {
    return 'Name must be at least 2 characters.';
  }
  return null;
}

/**
 * Validate booking date:
 * - Required
 * - Cannot be in the past
 */
function validateBookingDate(dateStr) {
  if (!dateStr) return 'Booking date is required.';

  const input = new Date(dateStr);
  if (isNaN(input.getTime())) return 'Invalid date.';

  // Compare only dates (no time)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  input.setHours(0, 0, 0, 0);

  if (input < today) {
    return 'Invalid date. Please select a future date.';
  }

  // Cannot book more than 1 calendar month in advance
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 1);
  maxDate.setHours(0, 0, 0, 0);
  if (input > maxDate) {
    return 'Booking allowed only up to 1 month in advance.';
  }

  return null;
}

module.exports = { validateEmail, validateName, validateBookingDate };
