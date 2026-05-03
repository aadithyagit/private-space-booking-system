package com.workspace.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLIntegrityConstraintViolationException;

import com.workspace.util.DBConnection;

public class UserDAO {

    public int addUser(String name, String email) {

        String sql = "INSERT INTO users (name, email) VALUES (?, ?)";
        int userId = -1;

        try (
            Connection con = DBConnection.getConnection();
            PreparedStatement ps = con.prepareStatement(
                    sql,
                    PreparedStatement.RETURN_GENERATED_KEYS
            )
        ) {

            ps.setString(1, name);
            ps.setString(2, email);

            ps.executeUpdate();

            // Get auto-generated user_id
            ResultSet rs = ps.getGeneratedKeys();
            if (rs.next()) {
                userId = rs.getInt(1);
            }

        }
        // ✅ DUPLICATE EMAIL HANDLING
        catch (SQLIntegrityConstraintViolationException e) {
            System.out.println("❌ Email already in use. Please use a different email.");
            return -1;
        }
        // ❌ OTHER ERRORS
        catch (Exception e) {
            System.out.println("❌ Error while adding user.");
            e.printStackTrace();
            return -1;
        }

        return userId;
    }
}
