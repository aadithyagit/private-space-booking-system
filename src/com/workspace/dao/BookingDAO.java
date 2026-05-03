package com.workspace.dao;

import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import com.workspace.util.DBConnection;

public class BookingDAO {

    public boolean bookWorkspace(
            int userId,
            int locationId,
            int slotId,
            Date bookingDate
    ) throws Exception {

        Connection con = DBConnection.getConnection();

        // ---------- CHECK SLOT AVAILABILITY ----------
        String checkSql = """
            SELECT 1 FROM bookings
            WHERE location_id = ?
            AND slot_id = ?
            AND booking_date = ?
            AND status = 'BOOKED'
        """;

        PreparedStatement psCheck = con.prepareStatement(checkSql);
        psCheck.setInt(1, locationId);
        psCheck.setInt(2, slotId);
        psCheck.setDate(3, bookingDate);

        ResultSet rs = psCheck.executeQuery();

        if (rs.next()) {
            throw new Exception("❌ Slot already booked for this location.");
        }

        // ---------- INSERT BOOKING ----------
        String insertSql = """
            INSERT INTO bookings
            (user_id, location_id, slot_id, booking_date, status)
            VALUES (?, ?, ?, ?, 'BOOKED')
        """;

        PreparedStatement psInsert = con.prepareStatement(insertSql);
        psInsert.setInt(1, userId);
        psInsert.setInt(2, locationId);
        psInsert.setInt(3, slotId);
        psInsert.setDate(4, bookingDate);

        psInsert.executeUpdate();

        return true;
    }
}
