// routes/locations.js
// GET /locations — from locations table only
// No manual input allowed, no other cities

const express = require('express');
const db = require('../db');
const router = express.Router();

// ============================================================
// GET /locations
// Returns all rows from locations table (Chennai areas only)
// ============================================================
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT location_id, location_name FROM locations ORDER BY location_name'
    );
    return res.json({ locations: rows });
  } catch (err) {
    console.error('Locations error:', err);
    return res.status(500).json({ error: 'Could not fetch locations.' });
  }
});

module.exports = router;
