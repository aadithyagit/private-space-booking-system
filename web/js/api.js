// api.js — Frontend API client matching exact schema
// Tables: locations, users, time_slots, bookings
// NO spaces table, NO password

const BASE = 'http://localhost:3000';

// ============================================================
// VALIDATION — mirrors server-side exactly
// ============================================================
const Validate = {
  email(email) {
    if (!email || email.trim() === '') return 'Email is required.';
    const t = email.trim();
    const atCount = (t.match(/@/g) || []).length;
    if (atCount !== 1) return 'Invalid email format.';
    const regex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!regex.test(t)) return 'Invalid email format.';
    const domain = t.split('@')[1];
    if (!domain || !domain.includes('.')) return 'Invalid email format.';
    return null;
  },

  name(n) {
    if (!n || n.trim().length < 2) return 'Name must be at least 2 characters.';
    return null;
  },

  date(dateStr) {
    if (!dateStr) return 'Booking date is required.';
    const input = new Date(dateStr);
    if (isNaN(input.getTime())) return 'Invalid date.';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    input.setHours(0, 0, 0, 0);
    if (input < today) return 'Invalid date. Please select a future date.';
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 1);
    maxDate.setHours(0, 0, 0, 0);
    if (input > maxDate) return 'Booking allowed only up to 1 month in advance.';
    return null;
  }
};

// ============================================================
// HTTP HELPERS
// ============================================================
async function post(endpoint, body) {
  const res = await fetch(BASE + endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function get(endpoint) {
  const res = await fetch(BASE + endpoint);
  return res.json();
}

async function put(endpoint, body = {}) {
  const res = await fetch(BASE + endpoint, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

// ============================================================
// AUTH — POST /register, POST /login
// ============================================================
async function apiRegister(name, email) {
  const nameErr = Validate.name(name);
  if (nameErr) return { error: nameErr };
  const emailErr = Validate.email(email);
  if (emailErr) return { error: emailErr };
  return post('/register', { name: name.trim(), email: email.trim().toLowerCase() });
}

async function apiLogin(email) {
  const emailErr = Validate.email(email);
  if (emailErr) return { error: emailErr };
  return post('/login', { email: email.trim().toLowerCase() });
}

// ============================================================
// LOCATIONS — GET /locations
// ============================================================
async function apiGetLocations() {
  return get('/locations');
}

// ============================================================
// TIME SLOTS — GET /time-slots
// ============================================================
async function apiGetTimeSlots() {
  return get('/time-slots');
}

// ============================================================
// BOOKINGS — POST /book
// ============================================================
async function apiBook(user_id, location_id, slot_ids, booking_date) {
  const dateErr = Validate.date(booking_date);
  if (dateErr) return { error: dateErr };
  return post('/book', { user_id, location_id, slot_ids, booking_date });
}

async function apiMyBookings(user_id) {
  return get('/book?user_id=' + user_id);
}

async function apiCancelBooking(booking_id, user_id) {
  return put(`/book/${booking_id}/cancel`, { user_id });
}

// ============================================================
// SESSION HELPERS (localStorage — no JWT since no password)
// ============================================================
function saveUser(user) {
  localStorage.setItem('sbUser', JSON.stringify(user));
}

function getUser() {
  return JSON.parse(localStorage.getItem('sbUser') || 'null');
}

function logout() {
  localStorage.removeItem('sbUser');
  window.location.href = 'index.html';
}

// ============================================================
// UI HELPERS
// ============================================================
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => { t.className = 'toast'; }, 3500);
}

function showError(fieldId, msg) {
  const old = document.getElementById(fieldId + '-err');
  if (old) old.remove();
  if (!msg) return;
  const el = document.getElementById(fieldId);
  if (!el) return;
  const err = document.createElement('span');
  err.id = fieldId + '-err';
  err.className = 'field-error';
  err.textContent = msg;
  el.closest('.form-group')?.appendChild(err) || el.parentNode.insertAdjacentElement('afterend', err);
}

function clearErrors(...ids) {
  ids.forEach(id => {
    const old = document.getElementById(id + '-err');
    if (old) old.remove();
  });
}

function showModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}

function hideModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

function toggleNav() {
  document.getElementById('mobileNav')?.classList.toggle('open');
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function statusBadge(s) {
  const cls = s === 'BOOKED' ? 'status-confirmed' : 'status-cancelled';
  return `<span class="status-badge ${cls}">${s}</span>`;
}

// Update navbar based on session
function updateNav() {
  const user = getUser();
  const navAuth = document.getElementById('navAuth');
  if (!navAuth) return;
  if (user) {
    navAuth.innerHTML = `
      <span style="font-size:13px;color:var(--text-muted)">Hi, ${user.name.split(' ')[0]}</span>
      <a href="user-dashboard.html" class="btn-primary">My Bookings</a>
      <button class="btn-outline" onclick="logout()">Logout</button>`;
  }
}

// Set today as min date on all date inputs + real-time validation
document.addEventListener('DOMContentLoaded', () => {
  updateNav();
  const today = new Date().toISOString().split('T')[0];
  document.querySelectorAll('input[type=date]').forEach(inp => {
    inp.min = today;
    inp.addEventListener('change', function () {
      const err = Validate.date(this.value);
      showError(this.id, err);
    });
  });
  document.querySelectorAll('input[type=email]').forEach(inp => {
    inp.addEventListener('blur', function () {
      const err = Validate.email(this.value);
      showError(this.id, err);
    });
    inp.addEventListener('input', function () {
      clearErrors(this.id);
    });
  });
});

window.addEventListener('click', e => {
  document.querySelectorAll('.modal-bg.open').forEach(m => {
    if (e.target === m) m.classList.remove('open');
  });
});
