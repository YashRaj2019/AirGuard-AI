package com.airguard.controller;

import com.airguard.dto.ApiResponse;
import com.airguard.dto.AuthDTO;
import com.airguard.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthDTO.AuthResponse>> register(@Valid @RequestBody AuthDTO.RegisterRequest request) {
        AuthDTO.AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Account registered successfully", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthDTO.AuthResponse>> login(@Valid @RequestBody AuthDTO.LoginRequest request) {
        AuthDTO.AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Signed in successfully", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthDTO.UserSessionDTO>> getMe(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        AuthDTO.UserSessionDTO session = authService.getSessionUser(authHeader);
        return ResponseEntity.ok(ApiResponse.success("User session active", session));
    }
}
