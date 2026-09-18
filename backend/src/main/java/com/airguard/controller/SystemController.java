package com.airguard.controller;

import com.airguard.dto.ApiResponse;
import com.airguard.repository.CityRepository;
import com.airguard.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping({"/api/system", "/system"})
public class SystemController {

    private final DataSource dataSource;
    private final UserRepository userRepository;
    private final CityRepository cityRepository;

    public SystemController(DataSource dataSource, UserRepository userRepository, CityRepository cityRepository) {
        this.dataSource = dataSource;
        this.userRepository = userRepository;
        this.cityRepository = cityRepository;
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "UP");

        try (Connection conn = dataSource.getConnection()) {
            DatabaseMetaData meta = conn.getMetaData();
            status.put("databaseProduct", meta.getDatabaseProductName());
            status.put("databaseVersion", meta.getDatabaseProductVersion());
            status.put("jdbcUrlMasked", meta.getURL().replaceAll(":[^:@/]+@", ":***@"));
        } catch (Exception e) {
            status.put("databaseError", e.getMessage());
        }

        try {
            status.put("userCount", userRepository.count());
        } catch (Exception e) {
            status.put("userTableError", e.getMessage());
        }

        try {
            status.put("cityCount", cityRepository.count());
        } catch (Exception e) {
            status.put("cityTableError", e.getMessage());
        }

        return ResponseEntity.ok(ApiResponse.success(status));
    }
}
