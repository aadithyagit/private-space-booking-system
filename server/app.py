# app.py — SpaceBook Flask Backend
# Tables: locations, users, time_slots, bookings (exact schema)
# Updated: 30-day date window, multi-slot booking, capacity=30, transactions

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import mysql.connector
import re
import os
from datetime import date, datetime, timedelta

app = Flask(__name__, static_folder='../web', static_url_path='')
CORS(app)

# ─────────────────────────────────────────────
# DATABASE CONFIG
# ─────────────────────────────────────────────
DB_CONFIG = {
    'host':     'localhost',
    'user':     'root',
    'password': 'Tari@12!34#',
    'database': 'private_space_booking',
    'charset':  'utf8mb4'
}

def get_db():
    return mysql.connector.connect(**DB_CONFIG)

# ─────────────────────────────────────────────
# VALIDATION HELPERS
# ─────────────────────────────────────────────
def validate_email(email):
    if not email or not email.strip():
        return 'Email is required.'
    email = email.strip()
    if email.count('@') != 1:
        return 'Invalid email format.'
    pattern = r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        return 'Invalid email format.'
    domain = email.split('@')[1]
    if '.' not in domain:
        return 'Invalid email format.'
    return None

def validate_name(name):
    if not name or len(name.strip()) < 2:
        return 'Name must be at least 2 characters.'
    return None

def validate_booking_date(date_str):
    """
    Booking date rules:
    - Must not be in the past
    - Must not be more than 30 days from today
    """
    if not date_str:
        return 'Booking date is required.'
    try:
        booking_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return 'Invalid date format. Use YYYY-MM-DD.'

    today = date.today()
    max_date = today + timedelta(days=30)

    if booking_date < today:
        return 'Invalid date. Cannot book past dates.'
    if booking_date > max_date:
        return 'Booking allowed only within 30 days.'
    return None

def validate_slots_continuous(slot_ids):
    """
    slot_ids must be a non-empty list of consecutive integers.
    e.g. [3,4,5] is valid; [3,5,6] is not.
    """
    if not slot_ids or not isinstance(slot_ids, list):
        return 'slot_ids must be a non-empty array.'
    if len(slot_ids) == 0:
        return 'At least one slot_id is required.'
    # Remove duplicates and sort
    unique_sorted = sorted(set(slot_ids))
    for i in range(1, len(unique_sorted)):
        if unique_sorted[i] != unique_sorted[i - 1] + 1:
            return 'Slots must be continuous (e.g. [3,4,5]).'
    return None

def time_to_str(t):
    """Convert MySQL TIME (timedelta) or string to HH:MM:SS"""
    if hasattr(t, 'total_seconds'):
        total = int(t.total_seconds())
        h = total // 3600
        m = (total % 3600) // 60
        s = total % 60
        return f"{h:02d}:{m:02d}:{s:02d}"
    return str(t)

def to_12hr(t_str):
    """Convert HH:MM:SS to 12-hour format label"""
    parts = t_str.split(':')
    h, m = int(parts[0]), int(parts[1])
    suffix = 'PM' if h >= 12 else 'AM'
    return f"{h % 12 or 12}:{m:02d} {suffix}"

SLOT_CAPACITY = 30  # max users per slot per location per date

# ─────────────────────────────────────────────
# SERVE FRONTEND
# ─────────────────────────────────────────────
@app.route('/')
def index():
    return send_from_directory('../web', 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    file_path = os.path.join('../web', filename)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return send_from_directory('../web', filename)
    return send_from_directory('../web', 'index.html')

# ─────────────────────────────────────────────
# POST /register
# ─────────────────────────────────────────────
@app.route('/register', methods=['POST'])
def register():
    data  = request.get_json() or {}
    name  = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()

    err = validate_name(name)
    if err: return jsonify({'error': err}), 400
    err = validate_email(email)
    if err: return jsonify({'error': err}), 400

    try:
        conn = get_db()
        cur  = conn.cursor(dictionary=True)
        cur.execute('SELECT user_id FROM users WHERE email = %s', (email,))
        if cur.fetchone():
            cur.close(); conn.close()
            return jsonify({'error': 'User already registered, please login.'}), 409

        cur.execute('INSERT INTO users (name, email) VALUES (%s, %s)', (name, email))
        conn.commit()
        user_id = cur.lastrowid
        cur.close(); conn.close()

        return jsonify({
            'message': 'Registration successful.',
            'user': {'user_id': user_id, 'name': name, 'email': email}
        }), 201

    except mysql.connector.IntegrityError:
        return jsonify({'error': 'User already registered, please login.'}), 409
    except Exception as e:
        print('Register error:', e)
        return jsonify({'error': 'Server error. Please try again.'}), 500

# ─────────────────────────────────────────────
# POST /login
# ─────────────────────────────────────────────
@app.route('/login', methods=['POST'])
def login():
    data  = request.get_json() or {}
    email = data.get('email', '').strip().lower()

    err = validate_email(email)
    if err: return jsonify({'error': err}), 400

    try:
        conn = get_db()
        cur  = conn.cursor(dictionary=True)
        cur.execute('SELECT user_id, name, email FROM users WHERE email = %s', (email,))
        user = cur.fetchone()
        cur.close(); conn.close()

        if not user:
            return jsonify({'error': 'User not found. Please register first.'}), 404

        return jsonify({'message': 'Login successful.', 'user': user}), 200

    except Exception as e:
        print('Login error:', e)
        return jsonify({'error': 'Server error. Please try again.'}), 500

# ─────────────────────────────────────────────
# GET /locations
# ─────────────────────────────────────────────
@app.route('/locations', methods=['GET'])
def get_locations():
    try:
        conn = get_db()
        cur  = conn.cursor(dictionary=True)
        cur.execute('SELECT location_id, location_name FROM locations ORDER BY location_name')
        locations = cur.fetchall()
        cur.close(); conn.close()
        return jsonify({'locations': locations}), 200
    except Exception as e:
        print('Locations error:', e)
        return jsonify({'error': 'Could not fetch locations.'}), 500

# ─────────────────────────────────────────────
# GET /time-slots
# ─────────────────────────────────────────────
@app.route('/time-slots', methods=['GET'])
def get_time_slots():
    try:
        conn = get_db()
        cur  = conn.cursor(dictionary=True)
        cur.execute('SELECT slot_id, start_time, end_time FROM time_slots ORDER BY start_time')
        rows = cur.fetchall()
        cur.close(); conn.close()

        slots = []
        for r in rows:
            s = time_to_str(r['start_time'])
            e = time_to_str(r['end_time'])
            slots.append({
                'slot_id':    r['slot_id'],
                'start_time': s,
                'end_time':   e,
                'label':      f"{to_12hr(s)} - {to_12hr(e)}"
            })
        return jsonify({'time_slots': slots}), 200
    except Exception as e:
        print('Time slots error:', e)
        return jsonify({'error': 'Could not fetch time slots.'}), 500

# ─────────────────────────────────────────────
# GET /slots-availability?location_id=X&booking_date=YYYY-MM-DD
# Returns each slot with current booking count and availability
# ─────────────────────────────────────────────
@app.route('/slots-availability', methods=['GET'])
def slots_availability():
    location_id  = request.args.get('location_id')
    booking_date = request.args.get('booking_date')

    if not location_id or not booking_date:
        return jsonify({'error': 'location_id and booking_date are required.'}), 400

    err = validate_booking_date(booking_date)
    if err: return jsonify({'error': err}), 400

    try:
        conn = get_db()
        cur  = conn.cursor(dictionary=True)

        # Get all slots with live booking count for this location+date
        cur.execute('''
            SELECT t.slot_id, t.start_time, t.end_time,
                   COUNT(b.booking_id) AS booked_count
            FROM time_slots t
            LEFT JOIN bookings b
                ON b.slot_id = t.slot_id
               AND b.location_id = %s
               AND b.booking_date = %s
               AND b.status = 'BOOKED'
            GROUP BY t.slot_id, t.start_time, t.end_time
            ORDER BY t.start_time
        ''', (location_id, booking_date))
        rows = cur.fetchall()
        cur.close(); conn.close()

        slots = []
        for r in rows:
            s = time_to_str(r['start_time'])
            e = time_to_str(r['end_time'])
            booked = r['booked_count']
            slots.append({
                'slot_id':      r['slot_id'],
                'label':        f"{to_12hr(s)} - {to_12hr(e)}",
                'booked_count': booked,
                'available':    booked < SLOT_CAPACITY,
                'spots_left':   max(0, SLOT_CAPACITY - booked)
            })

        return jsonify({
            'slots': slots,
            'capacity_per_slot': SLOT_CAPACITY,
            'booking_date': booking_date
        }), 200

    except Exception as e:
        print('Slots availability error:', e)
        return jsonify({'error': 'Server error.'}), 500

# ─────────────────────────────────────────────
# POST /book — multi-slot booking with transaction
# Body: { user_id, location_id, slot_ids: [3,4,5], booking_date }
# ─────────────────────────────────────────────
@app.route('/book', methods=['POST'])
def create_booking():
    data         = request.get_json() or {}
    user_id      = data.get('user_id')
    location_id  = data.get('location_id')
    slot_ids     = data.get('slot_ids')        # array of ints
    booking_date = data.get('booking_date', '')

    # ── 1. Required field checks ──────────────────────────
    if not user_id:
        return jsonify({'error': 'user_id is required.'}), 400
    if not location_id:
        return jsonify({'error': 'location_id is required.'}), 400
    if slot_ids is None:
        return jsonify({'error': 'slot_ids array is required.'}), 400

    # ── 2. Date validation (today ≤ date ≤ today+30) ──────
    err = validate_booking_date(booking_date)
    if err: return jsonify({'error': err}), 400

    # ── 3. Slot continuity validation ─────────────────────
    err = validate_slots_continuous(slot_ids)
    if err: return jsonify({'error': err}), 400

    slot_ids_sorted = sorted(set(slot_ids))   # deduplicated, ascending

    conn = None
    try:
        conn = get_db()
        conn.autocommit = False               # manual transaction
        cur  = conn.cursor(dictionary=True)

        # ── 4. Verify user exists ──────────────────────────
        cur.execute('SELECT user_id FROM users WHERE user_id = %s', (user_id,))
        if not cur.fetchone():
            return jsonify({'error': 'User not found. Please register first.'}), 404

        # ── 5. Verify location exists (Chennai DB only) ────
        cur.execute(
            'SELECT location_id, location_name FROM locations WHERE location_id = %s',
            (location_id,)
        )
        loc = cur.fetchone()
        if not loc:
            return jsonify({'error': 'Invalid location. Only Chennai locations allowed.'}), 400

        # ── 6. Verify all slot_ids exist in time_slots ────
        placeholders = ','.join(['%s'] * len(slot_ids_sorted))
        cur.execute(
            f'SELECT slot_id FROM time_slots WHERE slot_id IN ({placeholders})',
            slot_ids_sorted
        )
        found_slots = {r['slot_id'] for r in cur.fetchall()}
        missing = set(slot_ids_sorted) - found_slots
        if missing:
            return jsonify({'error': f'Invalid slot_id(s): {sorted(missing)}'}), 400

        # ── 7. Capacity check for EACH slot ───────────────
        # Do this inside the transaction so counts are accurate
        for sid in slot_ids_sorted:
            cur.execute(
                '''SELECT COUNT(*) AS cnt FROM bookings
                   WHERE location_id=%s AND slot_id=%s AND booking_date=%s
                   AND status='BOOKED' ''',
                (location_id, sid, booking_date)
            )
            cnt = cur.fetchone()['cnt']
            if cnt >= SLOT_CAPACITY:
                conn.rollback()
                return jsonify({
                    'error': f'Slot full (30 people reached) for slot_id {sid}.'
                }), 409

        # ── 8. INSERT all slots (transaction) ─────────────
        inserted_ids = []
        for sid in slot_ids_sorted:
            cur.execute(
                '''INSERT INTO bookings (user_id, location_id, slot_id, booking_date, status)
                   VALUES (%s, %s, %s, %s, 'BOOKED')''',
                (user_id, location_id, sid, booking_date)
            )
            inserted_ids.append(cur.lastrowid)

        conn.commit()    # all or nothing

        # ── 9. Build human-readable slot range for response ─
        cur.execute(
            '''SELECT slot_id, start_time, end_time FROM time_slots
               WHERE slot_id IN (%s) ORDER BY start_time''' % placeholders,
            slot_ids_sorted
        )
        slot_rows = cur.fetchall()
        cur.close()

        first_start = to_12hr(time_to_str(slot_rows[0]['start_time']))
        last_end    = to_12hr(time_to_str(slot_rows[-1]['end_time']))
        slot_range  = f"{first_start} - {last_end}"

        return jsonify({
            'message':      'Booking confirmed!',
            'booking_ids':  inserted_ids,
            'booking': {
                'booking_id':   inserted_ids[0],
                'user_id':      user_id,
                'location':     loc['location_name'],
                'slot':         slot_range,
                'slots_booked': len(slot_ids_sorted),
                'booking_date': booking_date,
                'status':       'BOOKED'
            }
        }), 201

    except Exception as e:
        if conn:
            conn.rollback()   # ROLLBACK on any error
        print('Booking error:', e)
        return jsonify({'error': 'Server error. Please try again.'}), 500
    finally:
        if conn and conn.is_connected():
            conn.close()

# ─────────────────────────────────────────────
# GET /book?user_id=X  — list user's bookings
# ─────────────────────────────────────────────
@app.route('/book', methods=['GET'])
def get_bookings():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id is required.'}), 400
    try:
        conn = get_db()
        cur  = conn.cursor(dictionary=True)
        cur.execute('''
            SELECT b.booking_id, b.booking_date, b.status,
                   l.location_name,
                   t.start_time, t.end_time
            FROM bookings b
            JOIN locations l ON b.location_id = l.location_id
            JOIN time_slots t ON b.slot_id    = t.slot_id
            WHERE b.user_id = %s
            ORDER BY b.booking_date DESC, t.start_time ASC
        ''', (user_id,))
        rows = cur.fetchall()
        cur.close(); conn.close()

        bookings = []
        for r in rows:
            bookings.append({
                'booking_id':    r['booking_id'],
                'booking_date':  str(r['booking_date']),
                'status':        r['status'],
                'location_name': r['location_name'],
                'start_time':    time_to_str(r['start_time']),
                'end_time':      time_to_str(r['end_time'])
            })
        return jsonify({'bookings': bookings}), 200

    except Exception as e:
        print('Get bookings error:', e)
        return jsonify({'error': 'Could not fetch bookings.'}), 500

# ─────────────────────────────────────────────
# PUT /book/<id>/cancel
# ─────────────────────────────────────────────
@app.route('/book/<int:booking_id>/cancel', methods=['PUT'])
def cancel_booking(booking_id):
    data    = request.get_json() or {}
    user_id = data.get('user_id')
    try:
        conn = get_db()
        cur  = conn.cursor(dictionary=True)
        cur.execute(
            'SELECT * FROM bookings WHERE booking_id=%s AND user_id=%s',
            (booking_id, user_id)
        )
        row = cur.fetchone()
        if not row:
            return jsonify({'error': 'Booking not found.'}), 404
        if row['status'] == 'CANCELLED':
            return jsonify({'error': 'Already cancelled.'}), 400
        cur.execute(
            "UPDATE bookings SET status='CANCELLED' WHERE booking_id=%s",
            (booking_id,)
        )
        conn.commit()
        cur.close(); conn.close()
        return jsonify({'message': 'Booking cancelled successfully.'}), 200
    except Exception as e:
        print('Cancel error:', e)
        return jsonify({'error': 'Server error.'}), 500

# ─────────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────────
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'time': datetime.now().isoformat()}), 200

# ─────────────────────────────────────────────
# RUN
# ─────────────────────────────────────────────
if __name__ == '__main__':
    print('\n[OK] SpaceBook running at http://localhost:3000')
    print('  POST /register')
    print('  POST /login')
    print('  GET  /locations')
    print('  GET  /time-slots')
    print('  POST /book  (slot_ids array, 30-day window, capacity 30)')
    print('  GET  /slots-availability?location_id=X&booking_date=Y')
    print()
    app.run(host='0.0.0.0', port=3000, debug=True)
