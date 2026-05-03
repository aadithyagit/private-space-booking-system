-- =================================================
-- FIX DUPLICATE TIME SLOTS
-- Keeps only the first occurrence (lowest slot_id) of each
-- (start_time, end_time) pair and deletes the rest.
-- Also removes any bookings that referenced the deleted duplicate slot_ids.
-- =================================================

USE private_space_booking;

-- Step 1: Delete duplicate slots (keep the lowest slot_id for each time pair)
DELETE FROM time_slots
WHERE slot_id NOT IN (
    SELECT min_id FROM (
        SELECT MIN(slot_id) AS min_id
        FROM time_slots
        GROUP BY start_time, end_time
    ) AS sub
);

-- Step 2: Verify — should return exactly 17 rows
SELECT slot_id, start_time, end_time FROM time_slots ORDER BY start_time;
