-- =================================================
-- DATABASE RESET WITH UPDATED BOOKINGS TABLE
-- (UNIQUE constraint removed — capacity logic in backend)
-- =================================================
DROP DATABASE IF EXISTS private_space_booking;
CREATE DATABASE private_space_booking;
USE private_space_booking;

-- =================================================
-- LOCATIONS (CHENNAI ONLY)
-- =================================================
CREATE TABLE locations (
    location_id INT AUTO_INCREMENT PRIMARY KEY,
    location_name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO locations (location_name) VALUES
('Ashok Pillar'),
('Vadapalani'),
('Egmore'),
('Guindy'),
('T Nagar'),
('Porur'),
('ECR'),
('Velachery'),
('Anna Nagar'),
('Chrompet');

-- =================================================
-- USERS
-- =================================================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE
);

-- =================================================
-- TIME SLOTS (6 AM – 11 PM, 17 hourly slots)
-- UNIQUE(start_time, end_time) prevents duplicate inserts
-- =================================================
CREATE TABLE time_slots (
    slot_id INT AUTO_INCREMENT PRIMARY KEY,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    UNIQUE KEY uq_slot_time (start_time, end_time)
);

INSERT IGNORE INTO time_slots (start_time, end_time) VALUES
('06:00:00','07:00:00'),
('07:00:00','08:00:00'),
('08:00:00','09:00:00'),
('09:00:00','10:00:00'),
('10:00:00','11:00:00'),
('11:00:00','12:00:00'),
('12:00:00','13:00:00'),
('13:00:00','14:00:00'),
('14:00:00','15:00:00'),
('15:00:00','16:00:00'),
('16:00:00','17:00:00'),
('17:00:00','18:00:00'),
('18:00:00','19:00:00'),
('19:00:00','20:00:00'),
('20:00:00','21:00:00'),
('21:00:00','22:00:00'),
('22:00:00','23:00:00');

-- =================================================
-- BOOKINGS
-- UNIQUE constraint REMOVED → capacity enforced in backend (max 30)
-- =================================================
CREATE TABLE bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    location_id INT NOT NULL,
    slot_id INT NOT NULL,
    booking_date DATE NOT NULL,
    status ENUM('BOOKED','CANCELLED') DEFAULT 'BOOKED',

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(location_id),
    FOREIGN KEY (slot_id) REFERENCES time_slots(slot_id)
    -- NOTE: UNIQUE(location_id, slot_id, booking_date) removed
    -- Capacity limit (30 users per slot) is enforced in application logic
);
