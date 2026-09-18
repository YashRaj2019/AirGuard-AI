package com.airguard.service;

import com.airguard.dto.AuthDTO;
import com.airguard.entity.User;
import com.airguard.exception.InvalidRequestException;
import com.airguard.exception.ResourceNotFoundException;
import com.airguard.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private final UserRepository userRepository;
    private final Map<String, AuthDTO.UserSessionDTO> activeSessions = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public AuthDTO.AuthResponse register(AuthDTO.RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new InvalidRequestException("An account with this email address already exists. Please sign in instead.");
        }

        String passwordHash = hashPassword(request.getPassword(), null);
        User user = new User(request.getName().trim(), email, passwordHash, "ROLE_USER");
        user = userRepository.save(user);

        String token = generateToken(user);
        return new AuthDTO.AuthResponse(user.getId(), user.getName(), user.getEmail(), user.getRole(), token, "Account created successfully");
    }

    @Transactional(readOnly = true)
    public AuthDTO.AuthResponse login(AuthDTO.LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new InvalidRequestException("Invalid email or password. Please verify your credentials."));

        if (!verifyPassword(request.getPassword(), user.getPasswordHash())) {
            throw new InvalidRequestException("Invalid email or password. Please verify your credentials.");
        }

        String token = generateToken(user);
        return new AuthDTO.AuthResponse(user.getId(), user.getName(), user.getEmail(), user.getRole(), token, "Signed in successfully");
    }

    public AuthDTO.UserSessionDTO getSessionUser(String bearerHeader) {
        if (bearerHeader == null || bearerHeader.isBlank()) {
            throw new InvalidRequestException("Authentication token is required");
        }

        String token = bearerHeader.startsWith("Bearer ") ? bearerHeader.substring(7).trim() : bearerHeader.trim();
        AuthDTO.UserSessionDTO session = activeSessions.get(token);
        if (session == null) {
            // Check if token represents demo session or database user
            throw new ResourceNotFoundException("Session expired or invalid. Please sign in again.");
        }
        return session;
    }

    private String generateToken(User user) {
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        String token = HexFormat.of().formatHex(randomBytes);

        AuthDTO.UserSessionDTO session = new AuthDTO.UserSessionDTO(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                OffsetDateTime.now().toString()
        );
        activeSessions.put(token, session);
        return token;
    }

    public static String hashPassword(String password, String salt) {
        try {
            if (salt == null) {
                byte[] saltBytes = new byte[16];
                new SecureRandom().nextBytes(saltBytes);
                salt = HexFormat.of().formatHex(saltBytes);
            }
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest((salt + password).getBytes(StandardCharsets.UTF_8));
            String hex = HexFormat.of().formatHex(digest);
            return salt + ":" + hex;
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    public static boolean verifyPassword(String password, String storedHash) {
        if (storedHash == null || !storedHash.contains(":")) {
            return false;
        }
        String[] parts = storedHash.split(":", 2);
        String salt = parts[0];
        String expectedHash = hashPassword(password, salt);
        return expectedHash.equals(storedHash);
    }
}
