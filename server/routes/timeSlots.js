// routes/timeSlots.js
// GET /time-slots — from time_slots table

const express = require('express');
const db = require('../db');
const router = express.Router();

// ============================================================
// GET /time-slots
// Returns all rows from time_slots table
// ============================================================
router.get('/', async (req, res) => {
  try {
    // GROUP BY deduplicates in case time_slots table has duplicate rows
    const [rows] = await db.execute(
      `SELECT MIN(slot_id) AS slot_id, start_time, end_time
       FROM time_slots
       GROUP BY start_time, end_time
       ORDER BY start_time`
    );
    // Format time for display (e.g. "06:00 AM – 09:00 AM")
    const formatted = rows.map(r => ({
      slot_id: r.slot_id,
      start_time: r.start_time,
      end_time: r.end_time,
      label: formatSlot(r.start_time, r.end_time)
    }));
    return res.json({ time_slots: formatted });
  } catch (err) {
    console.error('Time slots error:', err);
    return res.status(500).json({ error: 'Could not fetch time slots.' });
  }
});

function formatSlot(start, end) {
  return `${to12Hr(start)} – ${to12Hr(end)}`;
}

function to12Hr(t) {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2,'0')} ${suffix}`;
}

module.exports = router;
