package com.hypernode;

import java.util.*;

/**
 * AuthenticationService-Handles user authentication and session management for the hypernode system.
 * 
 * This service ensures secure access to the network by managing user credentials, authenticating logins,
 * and issuing session tokens.
 */
public class AuthenticationService {

    private final Map<String, String> userCredentials; // Stores user credentials (username -> hashed password)
    private final Map<String, String> activeSessions; // Maps session tokens to usernames

    public AuthenticationService() {
        this.userCredentials = new HashMap<>();
        this.activeSessions = new HashMap<>();
    }

    /**
     * Registers a new user with the system.
     * 
     * @param username The username for the new user.
     * @param password The password for the new user.
     * @return True if the user was successfully registered; false if the username already exists.
     */
    public boolean registerUser(String username, String password) {
        if (userCredentials.containsKey(username)) {
            System.err.println("[ERROR] Username already exists: " + username);
            return false;
        }

        String hashedPassword = hashPassword(password);
        userCredentials.put(username, hashedPassword);
        System.out.println("[INFO] User registered successfully: " + username);
        return true;
    }

    /**
     * Authenticates a user and generates a session token upon successful login.
     * 
     * @param username The username of the user.
     * @param password The password of the user.
     * @return A session token if authentication is successful; null otherwise.
     */
    public String loginUser(String username, String password) {
        String hashedPassword = userCredentials.get(username);
        if (hashedPassword == null || !hashedPassword.equals(hashPassword(password))) {
            System.err.println("[ERROR] Invalid credentials for username: " + username);
            return null;
        }

        String sessionToken = generateSessionToken(username);
        activeSessions.put(sessionToken, username);
        System.out.println("[INFO] User logged in successfully: " + username);
        return sessionToken;
    }

    /**
     * Logs out a user by invalidating their session token.
     * 
     * @param sessionToken The session token to invalidate.
     */
    public void logoutUser(String sessionToken) {
        if (activeSessions.remove(sessionToken) != null) {
            System.out.println("[INFO] User logged out successfully for token: " + sessionToken);
        } else {
            System.err.println("[ERROR] Invalid session token: " + sessionToken);
        }
    }

    /**
     * Validates a session token.
     * 
     * @param sessionToken The session token to validate.
     * @return The username associated with the token if valid; null otherwise.
     */
    public String validateSession(String sessionToken) {
        return activeSessions.get(sessionToken);
    }

    // Utility methods

    private String hashPassword(String password) {
        // For demonstration, using a simple hash. In production, use a strong hash function like bcrypt.
        return Integer.toHexString(password.hashCode());
    }

    private String generateSessionToken(String username) {
        // Generate a simple token using UUID
        return UUID.randomUUID().toString();
    }

    public static void main(String[] args) {
        AuthenticationService authService = new AuthenticationService();

        // Demonstration of functionality
        authService.registerUser("user1", "password123");
        String token = authService.loginUser("user1", "password123");

        if (token != null) {
            System.out.println("[INFO] Validating session token...");
            String username = authService.validateSession(token);
            System.out.println("[INFO] Session token belongs to: " + username);

            authService.logoutUser(token);
            System.out.println("[INFO] Session token after logout: " + authService.validateSession(token));
        }
    }
}
