package com.airguard.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDTO {

    public static class LoginRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Password is required")
        private String password;

        public LoginRequest() {}

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class RegisterRequest {
        @NotBlank(message = "Name is required")
        @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
        private String name;

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 6, max = 100, message = "Password must be at least 6 characters")
        private String password;

        public RegisterRequest() {}

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class AuthResponse {
        private Long id;
        private String name;
        private String email;
        private String role;
        private String token;
        private String message;

        public AuthResponse() {}

        public AuthResponse(Long id, String name, String email, String role, String token, String message) {
            this.id = id;
            this.name = name;
            this.email = email;
            this.role = role;
            this.token = token;
            this.message = message;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }

        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }

    public static class UserSessionDTO {
        private Long user_id;
        private String name;
        private String email;
        private String role;
        private String created_at;

        public UserSessionDTO() {}

        public UserSessionDTO(Long user_id, String name, String email, String role, String created_at) {
            this.user_id = user_id;
            this.name = name;
            this.email = email;
            this.role = role;
            this.created_at = created_at;
        }

        public Long getUser_id() { return user_id; }
        public void setUser_id(Long user_id) { this.user_id = user_id; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }

        public String getCreated_at() { return created_at; }
        public void setCreated_at(String created_at) { this.created_at = created_at; }
    }
}
