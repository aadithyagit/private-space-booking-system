// index.js — SpaceBook Express Server
// Routes match exact schema: locations, users, time_slots, bookings

const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes      = require('./routes/auth');
const locationsRoutes = require('./routes/locations');
const timeSlotsRoutes = require('./routes/timeSlots');
const bookingsRoutes  = require('./routes/bookings');
const { securityHeaders, createRateLimiter } = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(securityHeaders);
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiter to authentication endpoints
const authLimiter = createRateLimiter({ max: 30, windowMs: 15 * 60 * 1000 });

// Serve frontend
app.use(express.static(path.join(__dirname, '../web')));

// ---- API Routes (as required) ----
app.use('/register',  authLimiter);
app.use('/login',     authLimiter);
app.use('/',          authRoutes);            // POST /register, POST /login
app.use('/locations', locationsRoutes);       // GET  /locations
app.use('/time-slots',timeSlotsRoutes);       // GET  /time-slots
app.use('/book',      bookingsRoutes);        // POST /book, GET /book, PUT /book/:id/cancel

// ---- Slot availability with capacity (30 people per slot) ----
const db = require('./db');
const { to12Hr, calculateAvailability } = require('./utils/timeFormat');
const CAPACITY = 30;

app.get('/slots-availability', async (req, res) => {
  try {
    const { location_id, booking_date } = req.query;
    if (!location_id || !booking_date) {
      return res.status(400).json({ error: 'location_id and booking_date are required.' });
    }

    // Reject dates more than 1 month out
    const today = new Date(); today.setHours(0,0,0,0);
    const maxDate = new Date(); maxDate.setMonth(maxDate.getMonth() + 1); maxDate.setHours(0,0,0,0);
    const chosen = new Date(booking_date); chosen.setHours(0,0,0,0);
    if (chosen < today)    return res.status(400).json({ error: 'Cannot book past dates.' });
    if (chosen > maxDate)  return res.status(400).json({ error: 'Booking allowed only up to 1 month in advance.' });

    // Fetch unique slots only (GROUP BY guards against any DB-level duplicates)
    const [slots] = await db.execute(
      `SELECT MIN(slot_id) AS slot_id, start_time, end_time
       FROM time_slots
       GROUP BY start_time, end_time
       ORDER BY start_time`
    );
    const [counts] = await db.execute(
      `SELECT slot_id, COUNT(*) AS cnt FROM bookings
       WHERE location_id = ? AND booking_date = ? AND status = 'BOOKED'
       GROUP BY slot_id`,
      [location_id, booking_date]
    );
    const countMap = {};
    counts.forEach(c => { countMap[c.slot_id] = Number(c.cnt); });

    const result = slots.map(s => {
      const booked = countMap[s.slot_id] || 0;
      const { spotsLeft, isAvailable } = calculateAvailability(CAPACITY, booked);
      // Normalize time fields to string (MySQL2 may return TIME as duration object)
      const startStr  = typeof s.start_time === 'string' ? s.start_time : String(s.start_time);
      const endStr    = typeof s.end_time   === 'string' ? s.end_time   : String(s.end_time);
      return {
        slot_id:    s.slot_id,
        label:      `${to12Hr(startStr)} - ${to12Hr(endStr)}`,
        start_time: startStr,
        end_time:   endStr,
        spots_left: spotsLeft,
        available:  isAvailable
      };
    });

    return res.json({ slots: result });
  } catch (err) {
    console.error('Slots availability error:', err);
    return res.status(500).json({ error: 'Could not fetch slot availability.' });
  }
});

// ---- Health check ----
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ---- 404 ----
app.use((req, res, next) => {
  if (req.path.startsWith('/register') ||
      req.path.startsWith('/login') ||
      req.path.startsWith('/locations') ||
      req.path.startsWith('/time-slots') ||
      req.path.startsWith('/book')) {
    return res.status(404).json({ error: 'Endpoint not found.' });
  }
  next();
});

// ---- Serve frontend for all other GET routes ----
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../web/index.html'));
});

// ---- Global error handler ----
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 SpaceBook running at http://localhost:${PORT}`);
  console.log(`  POST /register`);
  console.log(`  POST /login`);
  console.log(`  GET  /locations`);
  console.log(`  GET  /time-slots`);
  console.log(`  POST /book\n`);
});

module.exports = app;
