// routes/auth.js
// Schema: users(user_id, name, email) — NO password column
// Login: email-only lookup

const express = require('express');
const db = require('../db');
const { validateEmail, validateName } = require('../validation');

const router = express.Router();

// ============================================================
// POST /register
// Registers a new user using name + email only
// ============================================================
router.post('/register', async (req, res) => {
  try {
    const { name, email } = req.body;

    // Validate name
    const nameErr = validateName(name);
    if (nameErr) return res.status(400).json({ error: nameErr });

    // Validate email
    const emailErr = validateEmail(email);
    if (emailErr) return res.status(400).json({ error: emailErr });

    const cleanEmail = email.trim().toLowerCase();

    // Check if email already exists
    const [existing] = await db.execute(
      'SELECT user_id FROM users WHERE email = ?',
      [cleanEmail]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'User already registered, please login.' });
    }

    // Insert into users table (name, email only — schema has no password)
    const [result] = await db.execute(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      [name.trim(), cleanEmail]
    );

    return res.status(201).json({
      message: 'Registration successful.',
      user: {
        user_id: result.insertId,
        name: name.trim(),
        email: cleanEmail
      }
    });

  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'User already registered, please login.' });
    }
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ============================================================
// POST /login
// Login by email only (schema has no password column)
// ============================================================
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;

    const emailErr = validateEmail(email);
    if (emailErr) return res.status(400).json({ error: emailErr });

    const cleanEmail = email.trim().toLowerCase();

    const [rows] = await db.execute(
      'SELECT user_id, name, email FROM users WHERE email = ?',
      [cleanEmail]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found. Please register first.' });
    }

    const user = rows[0];
    return res.status(200).json({
      message: 'Login successful.',
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

module.exports = router;
