# 🏢 Private Space Booking System (PWSBS)

A **production-ready private space booking platform** for Chennai, built with **Node.js**, **Express**, **MySQL**, and a modern **Vanilla JS** frontend.

---

## 🚀 Features

- 📍 **10 Chennai locations** to choose from
- 🕐 **17 hourly time slots** (6 AM – 11 PM)
- 👥 **Max 30 users per slot** — capacity enforced in backend
- 📅 **Booking window** — today to 1 month ahead only
- 🔗 **Multi-slot continuous booking** in a single transaction
- ✅ **Duplicate booking prevention** per user per slot
- 🛡️ **Security & Rate Limiting** — HTTP security headers and endpoint protection
- 🧪 **Automated Testing** — Suite covering validation, utilities, and middleware
- 🐳 **Containerization** — Dockerfile and Docker Compose orchestration with MySQL
- ⚡ **CI/CD** — Multi-version Node.js matrix GitHub Actions workflow
- 📊 **User dashboard** with booking history & cancel support

---

## 🗂️ Project Structure

```
PWSBS/
├── server/                  # Node.js + Express backend
│   ├── index.js             # Entry point, /slots-availability endpoint
│   ├── db.js                # MySQL connection pool
│   ├── validation.js        # Input validators
│   └── routes/
│       ├── auth.js          # POST /register, POST /login
│       ├── bookings.js      # POST /book, GET /book, PUT /book/:id/cancel
│       ├── locations.js     # GET /locations
│       └── timeSlots.js     # GET /time-slots
├── web/                     # Frontend (HTML + CSS + Vanilla JS)
│   ├── index.html           # Homepage
│   ├── book.html            # Booking page
│   ├── register.html        # Registration page
│   ├── user-dashboard.html  # My Bookings dashboard
│   ├── css/style.css        # Global styles
│   └── js/
│       ├── api.js           # API client + UI helpers
│       └── app.js           # Shared app logic
└── database/
    ├── schema.sql           # Full DB schema (DROP + CREATE + seed)
    └── fix_duplicates.sql   # One-time cleanup for duplicate time_slots
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v18+
- MySQL 8+

### 1. Database Setup

Run the schema in MySQL Workbench or CLI:

```sql
source database/schema.sql
```

### 2. Configure DB Credentials

Copy the example env file and fill in your MySQL password:

```bash
cd server
copy .env.example .env
```

Then edit `server/.env`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=private_space_booking
PORT=3000
```

> ⚠️ The `.env` file is listed in `.gitignore` and will **never be pushed to GitHub**.

### 3. Install Dependencies, Run Tests & Start Server

```bash
cd server
npm install
npm test
node index.js
```

### 4. Running with Docker Compose (Alternative)

To spin up the entire application including MySQL with automated schema initialization:

```bash
docker-compose up --build
```

The application will be available at: **http://localhost:3000**

---

## 🔌 API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/register` | Register a new user |
| POST | `/login` | Login by email |
| GET | `/locations` | List all Chennai locations |
| GET | `/time-slots` | List all 17 hourly slots |
| GET | `/slots-availability?location_id=&booking_date=` | Slot availability with spots left |
| POST | `/book` | Book one or more continuous slots |
| GET | `/book?user_id=` | Get all bookings for a user |
| PUT | `/book/:id/cancel` | Cancel a booking |

---

## 🛡️ Business Rules

- Slots: **6 AM to 11 PM** (17 slots), fixed in DB — no custom input
- Capacity: **Max 30 bookings** per `(location, slot, date)` combination
- Continuity: Selected slots must be **adjacent** (no gaps)
- Date range: **Today to +1 month** only
- No duplicate: A user **cannot book the same slot twice** at same location+date

---

## 🗃️ Database Schema

```
locations   → location_id, location_name
users       → user_id, name, email (UNIQUE)
time_slots  → slot_id, start_time, end_time (UNIQUE per time pair)
bookings    → booking_id, user_id, location_id, slot_id, booking_date, status
```

---

## 📸 Pages

| Page | URL |
|------|-----|
| Home | `/` |
| Book a Space | `/book.html` |
| Register | `/register.html` |
| My Bookings | `/user-dashboard.html` |

---

## 🧑‍💻 Tech Stack

- **Backend**: Node.js, Express.js, mysql2
- **Database**: MySQL 8 (`private_space_booking`)
- **Frontend**: HTML5, Vanilla CSS, Vanilla JavaScript
- **Font**: Inter (Google Fonts)
