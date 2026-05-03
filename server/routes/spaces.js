// routes/spaces.js — Spaces & Chennai areas endpoints
const express = require('express');
const db = require('../db');

const router = express.Router();

// ==========================================
// GET /api/spaces/areas
// Returns ONLY Chennai areas present in DB
// ==========================================
router.get('/areas', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT DISTINCT area FROM spaces ORDER BY area'
    );
    const areas = rows.map(r => r.area);
    return res.json({ areas });
  } catch (err) {
    console.error('Areas fetch error:', err);
    return res.status(500).json({ error: 'Could not fetch areas.' });
  }
});

// ==========================================
// GET /api/spaces
// Optional query: ?area=Anna Nagar&type=hall
// BLOCKS non-DB areas if area param provided
// ==========================================
router.get('/', async (req, res) => {
  try {
    const { area, type } = req.query;

    // If area is provided, verify it exists in DB (Chennai-only guard)
    if (area) {
      const [areaCheck] = await db.execute(
        'SELECT COUNT(*) as cnt FROM spaces WHERE area = ?',
        [area.trim()]
      );
      if (areaCheck[0].cnt === 0) {
        return res.status(400).json({
          error: 'Invalid area. Only Chennai areas from our database are allowed.'
        });
      }
    }

    let query = 'SELECT * FROM spaces WHERE available = 1';
    const params = [];

    if (area) { query += ' AND area = ?'; params.push(area.trim()); }
    if (type) { query += ' AND type = ?'; params.push(type.trim()); }
    query += ' ORDER BY name';

    const [rows] = await db.execute(query, params);
    return res.json({ spaces: rows, total: rows.length });

  } catch (err) {
    console.error('Spaces fetch error:', err);
    return res.status(500).json({ error: 'Could not fetch spaces.' });
  }
});

// ==========================================
// GET /api/spaces/:id
// ==========================================
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM spaces WHERE id = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Space not found.' });
    return res.json({ space: rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
});

// ==========================================
// GET /api/spaces/:id/availability?date=YYYY-MM-DD
// Check if space is booked on a given date
// ==========================================
router.get('/:id/availability', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'Date parameter is required.' });

    const [rows] = await db.execute(
      `SELECT id, status FROM bookings
       WHERE space_id = ? AND booking_date = ? AND status != 'cancelled'`,
      [req.params.id, date]
    );

    return res.json({ available: rows.length === 0, date });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
