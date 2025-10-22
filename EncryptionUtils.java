package com.hypernode.utils;

import java.security.Key;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;

/**
 * EncryptionUtils - A utility class for encryption and decryption in the hypernode network.
 *
 * This class provides methods to encrypt and decrypt data using symmetric key encryption (AES).
 */
public class EncryptionUtils {

    private static final String ALGORITHM = "AES";

    /**
     * Generates a new AES key.
     *
     * @return The generated AES key as a Base64 encoded string.
     * @throws Exception If an error occurs during key generation.
     */
    public static String generateKey() throws Exception {
        KeyGenerator keyGen = KeyGenerator.getInstance(ALGORITHM);
        keyGen.init(256); // Use 256-bit AES encryption
        SecretKey secretKey = keyGen.generateKey();
        return Base64.getEncoder().encodeToString(secretKey.getEncoded());
    }

    /**
     * Encrypts data using the provided AES key.
     *
     * @param data The data to encrypt.
     * @param base64Key The AES key in Base64 encoded format.
     * @return The encrypted data as a Base64 encoded string.
     * @throws Exception If an error occurs during encryption.
     */
    public static String encrypt(String data, String base64Key) throws Exception {
        byte[] decodedKey = Base64.getDecoder().decode(base64Key);
        Key key = new SecretKeySpec(decodedKey, ALGORITHM);
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        cipher.init(Cipher.ENCRYPT_MODE, key);
        byte[] encryptedData = cipher.doFinal(data.getBytes());
        return Base64.getEncoder().encodeToString(encryptedData);
    }

    /**
     * Decrypts data using the provided AES key.
     *
     * @param encryptedData The encrypted data in Base64 encoded format.
     * @param base64Key The AES key in Base64 encoded format.
     * @return The decrypted data as a plain text string.
     * @throws Exception If an error occurs during decryption.
     */
    public static String decrypt(String encryptedData, String base64Key) throws Exception {
        byte[] decodedKey = Base64.getDecoder().decode(base64Key);
        Key key = new SecretKeySpec(decodedKey, ALGORITHM);
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        cipher.init(Cipher.DECRYPT_MODE, key);
        byte[] decryptedData = cipher.doFinal(Base64.getDecoder().decode(encryptedData));
        return new String(decryptedData);
    }

    public static void main(String[] args) {
        try {
            // Generate a new AES key
            String key = generateKey();
            System.out.println("Generated Key: " + key);

            // Sample data to encrypt and decrypt
            String originalData = "Sensitive hypernode Data";
            System.out.println("Original Data: " + originalData);

            // Encrypt the data
            String encryptedData = encrypt(originalData, key);
            System.out.println("Encrypted Data: " + encryptedData);

            // Decrypt the data
            String decryptedData = decrypt(encryptedData, key);
            System.out.println("Decrypted Data: " + decryptedData);
        } catch (Exception e) {
            System.err.println("[ERROR] " + e.getMessage());
        }
    }
}
