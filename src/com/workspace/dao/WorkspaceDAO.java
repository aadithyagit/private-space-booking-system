package com.workspace.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import com.workspace.util.DBConnection;

public class WorkspaceDAO {

    public void showLocations() {

        String sql = "SELECT location_id, location_name FROM locations";

        try (
            Connection con = DBConnection.getConnection();
            PreparedStatement ps = con.prepareStatement(sql);
            ResultSet rs = ps.executeQuery()
        ) {
            while (rs.next()) {
                System.out.println(
                        rs.getInt("location_id") + ". " +
                        rs.getString("location_name")
                );
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void showSlots() {

        String sql = "SELECT slot_id, start_time, end_time FROM time_slots";

        try (
            Connection con = DBConnection.getConnection();
            PreparedStatement ps = con.prepareStatement(sql);
            ResultSet rs = ps.executeQuery()
        ) {
            while (rs.next()) {
                System.out.println(
                        rs.getInt("slot_id") + ". " +
                        rs.getTime("start_time") + " - " +
                        rs.getTime("end_time")
                );
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
