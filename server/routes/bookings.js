// routes/bookings.js
// POST /book — accepts slot_ids[] for multi-slot booking in one go
// Capacity: max 30 people per (location, slot, date)
// Slots must be consecutive (no gaps)

const express = require('express');
const db = require('../db');
const { validateBookingDate } = require('../validation');
const router = express.Router();

// ============================================================
// POST /book
// Body: { user_id, location_id, slot_ids: [id,...], booking_date }
// ============================================================
router.post('/', async (req, res) => {
  try {
    const { user_id, location_id, slot_ids, booking_date } = req.body;

    // ---- Validate required fields ----
    if (!user_id)     return res.status(400).json({ error: 'user_id is required.' });
    if (!location_id) return res.status(400).json({ error: 'location_id is required.' });
    if (!slot_ids || !Array.isArray(slot_ids) || slot_ids.length === 0)
      return res.status(400).json({ error: 'At least one slot_id is required.' });

    // ---- Validate booking_date (no past dates, max 1 month ahead) ----
    const dateErr = validateBookingDate(booking_date);
    if (dateErr) return res.status(400).json({ error: dateErr });

    // ---- Verify user_id exists ----
    const [userRows] = await db.execute(
      'SELECT user_id FROM users WHERE user_id = ?',
      [user_id]
    );
    if (!userRows.length) {
      return res.status(404).json({ error: 'User not found. Please register first.' });
    }

    // ---- Verify location_id exists ----
    const [locRows] = await db.execute(
      'SELECT location_id, location_name FROM locations WHERE location_id = ?',
      [location_id]
    );
    if (!locRows.length) {
      return res.status(400).json({ error: 'Invalid location. Only Chennai locations from the database are allowed.' });
    }

    // ---- Fetch all requested slots and verify they exist ----
    const placeholders = slot_ids.map(() => '?').join(',');
    const [slotRows] = await db.execute(
      `SELECT slot_id, start_time, end_time FROM time_slots WHERE slot_id IN (${placeholders}) ORDER BY start_time`,
      slot_ids
    );
    if (slotRows.length !== slot_ids.length) {
      return res.status(400).json({ error: 'One or more slot IDs are invalid.' });
    }

    // ---- Ensure slots are consecutive (no gaps) ----
    // Normalize time values: MySQL2 may return TIME as string or object
    function normTime(t) { return typeof t === 'string' ? t : String(t); }
    for (let i = 0; i < slotRows.length - 1; i++) {
      if (normTime(slotRows[i].end_time) !== normTime(slotRows[i + 1].start_time)) {
        return res.status(400).json({
          error: 'Selected slots must be continuous (no gaps allowed between slots).'
        });
      }
    }

    // ---- Check 30-person capacity + no duplicate booking for same user ----
    const CAPACITY = 30;
    for (const sid of slot_ids) {
      const slotFound = slotRows.find(s => s.slot_id === sid);
      const slotLabel = slotFound
        ? `${normTime(slotFound.start_time).substring(0,5)}–${normTime(slotFound.end_time).substring(0,5)}`
        : `slot #${sid}`;

      // Capacity check
      const [countRows] = await db.execute(
        `SELECT COUNT(*) AS cnt FROM bookings
         WHERE location_id = ? AND slot_id = ? AND booking_date = ? AND status = 'BOOKED'`,
        [location_id, sid, booking_date]
      );
      if (Number(countRows[0].cnt) >= CAPACITY) {
        return res.status(409).json({
          error: `Slot ${slotLabel} is FULL (30/30 people booked). Choose a different slot or date.`
        });
      }

      // Same-user duplicate booking check
      const [dupRows] = await db.execute(
        `SELECT booking_id FROM bookings
         WHERE user_id = ? AND location_id = ? AND slot_id = ? AND booking_date = ? AND status = 'BOOKED'`,
        [user_id, location_id, sid, booking_date]
      );
      if (dupRows.length > 0) {
        return res.status(409).json({
          error: `You have already booked slot ${slotLabel} on this date at this location.`
        });
      }
    }

    // ---- Insert one booking row per slot ----
    const insertedIds = [];
    for (const sid of slot_ids) {
      const [result] = await db.execute(
        `INSERT INTO bookings (user_id, location_id, slot_id, booking_date, status)
         VALUES (?, ?, ?, ?, 'BOOKED')`,
        [user_id, location_id, sid, booking_date]
      );
      insertedIds.push(result.insertId);
    }

    const firstSlot = slotRows[0];
    const lastSlot  = slotRows[slotRows.length - 1];

    return res.status(201).json({
      message: 'Booking confirmed!',
      booking: {
        booking_id:   insertedIds[0],
        booking_ids:  insertedIds,
        user_id,
        location:     locRows[0].location_name,
        slot:         `${firstSlot.start_time.substring(0,5)} – ${lastSlot.end_time.substring(0,5)}`,
        slots_booked: slot_ids.length,
        booking_date,
        status:       'BOOKED'
      }
    });

  } catch (err) {
    console.error('Booking error:', err);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ============================================================
// GET /book?user_id=X
// Fetch all bookings for a user
// ============================================================
router.get('/', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id is required.' });

    const [rows] = await db.execute(
      `SELECT
         b.booking_id,
         b.booking_date,
         b.status,
         l.location_name,
         t.start_time,
         t.end_time
       FROM bookings b
       JOIN locations l ON b.location_id = l.location_id
       JOIN time_slots t ON b.slot_id = t.slot_id
       WHERE b.user_id = ?
       ORDER BY b.booking_date DESC, t.start_time ASC`,
      [user_id]
    );

    return res.json({ bookings: rows });
  } catch (err) {
    console.error('Fetch bookings error:', err);
    return res.status(500).json({ error: 'Could not fetch bookings.' });
  }
});

// ============================================================
// PUT /book/:booking_id/cancel
// Cancel a booking (sets status = 'CANCELLED')
// ============================================================
router.put('/:booking_id/cancel', async (req, res) => {
  try {
    const { booking_id } = req.params;
    const { user_id } = req.body;

    const [rows] = await db.execute(
      'SELECT * FROM bookings WHERE booking_id = ? AND user_id = ?',
      [booking_id, user_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Booking not found.' });
    if (rows[0].status === 'CANCELLED') return res.status(400).json({ error: 'Already cancelled.' });

    await db.execute(
      "UPDATE bookings SET status = 'CANCELLED' WHERE booking_id = ?",
      [booking_id]
    );

    return res.json({ message: 'Booking cancelled successfully.' });
  } catch (err) {
    console.error('Cancel error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
