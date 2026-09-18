package com.airguard;

import com.airguard.dto.AuthDTO;
import com.airguard.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class AuthServiceTest {

    @Autowired
    private AuthService authService;

    @Test
    public void testRegisterUser() {
        String uniqueEmail = "user_" + UUID.randomUUID().toString().substring(0, 8) + "@example.com";
        AuthDTO.RegisterRequest request = new AuthDTO.RegisterRequest();
        request.setName("Rahul Test");
        request.setEmail(uniqueEmail);
        request.setPassword("password123");

        AuthDTO.AuthResponse response = authService.register(request);
        assertNotNull(response);
        assertEquals("Rahul Test", response.getName());
        assertEquals(uniqueEmail, response.getEmail());
    }
}
