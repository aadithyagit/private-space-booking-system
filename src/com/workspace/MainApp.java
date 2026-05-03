package com.workspace;

import java.sql.Date;
import java.util.Scanner;

import com.workspace.dao.BookingDAO;
import com.workspace.dao.UserDAO;
import com.workspace.dao.WorkspaceDAO;

public class MainApp {

    public static void main(String[] args) {

        Scanner sc = new Scanner(System.in);

        UserDAO userDAO = new UserDAO();
        WorkspaceDAO workspaceDAO = new WorkspaceDAO();
        BookingDAO bookingDAO = new BookingDAO();

        int currentUserId = -1;

        while (true) {

            System.out.println("\n===== PRIVATE WORKSPACE BOOKING SYSTEM =====");
            System.out.println("1. Add User");
            System.out.println("2. Book Workspace");
            System.out.println("3. Exit");
            System.out.print("Enter your choice: ");

            int choice = sc.nextInt();
            sc.nextLine();

            switch (choice) {

                // ================= ADD USER =================
                case 1:
                    System.out.print("Enter user name: ");
                    String name = sc.nextLine();

                    String emailRegex =
                            "^[a-zA-Z0-9._%+-]+@(gmail|yahoo|outlook|hotmail)\\.(com|in)$";

                    while (true) {
                        System.out.print("Enter user email: ");
                        String email = sc.nextLine();

                        if (!email.matches(emailRegex)) {
                            System.out.println("❌ Invalid email format. Try again.");
                            continue;
                        }

                        int userId = userDAO.addUser(name, email);

                        if (userId == -1) {
                            // duplicate email
                            continue;
                        }

                        currentUserId = userId;
                        System.out.println("✅ User added successfully. User ID: " + currentUserId);
                        break;
                    }
                    break;

                // ================= BOOK WORKSPACE =================
                case 2:
                    if (currentUserId == -1) {
                        System.out.println("❌ Please add a user before booking.");
                        break;
                    }

                    System.out.println("\nAvailable Locations:");
                    workspaceDAO.showLocations();

                    System.out.print("\nEnter Location ID: ");
                    int locationId = sc.nextInt();

                    System.out.println("\nAvailable Time Slots (06:00 – 23:00):");
                    workspaceDAO.showSlots();   // reads from time_slots table

                    System.out.print("\nEnter Slot ID: ");
                    int slotId = sc.nextInt();
                    sc.nextLine();

                    System.out.print("Enter booking date (yyyy-mm-dd): ");
                    Date bookingDate = Date.valueOf(sc.nextLine());

                    try {
                        bookingDAO.bookWorkspace(
                                currentUserId,
                                locationId,
                                slotId,
                                bookingDate
                        );
                        System.out.println("✅ Booking successful!");
                    } catch (Exception e) {
                        System.out.println(e.getMessage());
                    }
                    break;

                // ================= EXIT =================
                case 3:
                    System.out.println("Exiting system...");
                    sc.close();
                    System.exit(0);

                default:
                    System.out.println("❌ Invalid choice. Try again.");
            }
        }
    }
}
