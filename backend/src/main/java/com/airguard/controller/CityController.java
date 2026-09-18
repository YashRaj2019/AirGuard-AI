package com.airguard.controller;

import com.airguard.dto.*;
import com.airguard.service.AirQualityService;
import com.airguard.service.CityService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/cities")
public class CityController {

    private final CityService cityService;
    private final AirQualityService airQualityService;

    public CityController(CityService cityService, AirQualityService airQualityService) {
        this.cityService = cityService;
        this.airQualityService = airQualityService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CityDTO>>> getCities() {
        return ResponseEntity.ok(ApiResponse.success(cityService.getAllCities()));
    }

    @GetMapping("/{name}")
    public ResponseEntity<ApiResponse<CityDTO>> getCityByName(@PathVariable String name) {
        return ResponseEntity.ok(ApiResponse.success(cityService.getCityByName(name)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<GeocodingResultDTO>>> searchCities(@RequestParam String query) {
        List<GeocodingResultDTO> results = cityService.searchCities(query);
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    @PostMapping("/locate")
    public ResponseEntity<ApiResponse<CityDTO>> locateUser(@Valid @RequestBody LocateRequestDTO request) {
        CityDTO city = cityService.locateAndRegister(request.getLatitude(), request.getLongitude(), request.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(city));
    }

    @PostMapping("/add")
    public ResponseEntity<ApiResponse<CityDTO>> addCity(@Valid @RequestBody AddCityRequestDTO request) {
        CityDTO city = cityService.addCustomCity(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(city));
    }

    @GetMapping("/compare")
    public ResponseEntity<ApiResponse<CityCompareDTO>> compareCities(
            @RequestParam(required = false) String city1,
            @RequestParam(required = false) String city2,
            @RequestParam(required = false) String city3) {

        List<String> list = new ArrayList<>();
        if (city1 != null && !city1.isBlank()) list.add(city1.trim());
        if (city2 != null && !city2.isBlank()) list.add(city2.trim());
        if (city3 != null && !city3.isBlank()) list.add(city3.trim());

        if (list.isEmpty()) {
            list.add("Delhi");
            list.add("Mumbai");
        }

        CityCompareDTO comparison = airQualityService.compareCities(list);
        return ResponseEntity.ok(ApiResponse.success(comparison));
    }
}
