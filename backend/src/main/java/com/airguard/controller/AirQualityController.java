package com.airguard.controller;

import com.airguard.dto.*;
import com.airguard.service.AirQualityService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/air-quality", "/air-quality"})
public class AirQualityController {

    private final AirQualityService airQualityService;

    public AirQualityController(AirQualityService airQualityService) {
        this.airQualityService = airQualityService;
    }

    @GetMapping("/current/{city}")
    public ResponseEntity<ApiResponse<CurrentAirQualityDTO>> getCurrent(@PathVariable String city) {
        return ResponseEntity.ok(ApiResponse.success(airQualityService.getCurrentAirQuality(city)));
    }

    @GetMapping("/history/{city}")
    public ResponseEntity<ApiResponse<List<HistoricalRecordDTO>>> getHistory(
            @PathVariable String city,
            @RequestParam(defaultValue = "72") int hours) {
        return ResponseEntity.ok(ApiResponse.success(airQualityService.getHistoricalRecords(city, hours)));
    }

    @GetMapping("/trends/{city}")
    public ResponseEntity<ApiResponse<TrendsDTO>> getTrends(@PathVariable String city) {
        return ResponseEntity.ok(ApiResponse.success(airQualityService.getTrends(city)));
    }

    @GetMapping("/pollutants/{city}")
    public ResponseEntity<ApiResponse<List<PollutantDetailDTO>>> getPollutants(@PathVariable String city) {
        return ResponseEntity.ok(ApiResponse.success(airQualityService.getPollutantDetails(city)));
    }
}
