/**
 * Convert 24-hour time string (HH:MM or HH:MM:SS) to 12-hour formatted string with AM/PM
 * @param {string} timeStr - Time string like "09:00", "13:30:00", "00:00"
 * @returns {string} Formatted 12-hour time string like "9:00 AM", "1:30 PM", "12:00 AM"
 */
function to12Hr(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;

  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (isNaN(h) || isNaN(m)) return timeStr;

  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

/**
 * Calculate available capacity and spots left given total capacity and booked count
 * @param {number} capacity - Maximum allowed bookings (default 30)
 * @param {number} bookedCount - Current number of confirmed bookings
 * @returns {{ spotsLeft: number, isAvailable: boolean }}
 */
function calculateAvailability(capacity, bookedCount) {
  const cap = Number(capacity) || 0;
  const booked = Number(bookedCount) || 0;
  const spotsLeft = Math.max(0, cap - booked);
  return {
    spotsLeft,
    isAvailable: spotsLeft > 0
  };
}

module.exports = { to12Hr, calculateAvailability };
