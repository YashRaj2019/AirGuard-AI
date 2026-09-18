package com.airguard.controller;

import com.airguard.dto.*;
import com.airguard.service.AIService;
import com.airguard.service.AirQualityService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping({"/api/ai", "/ai"})
public class AIController {

    private final AIService aiService;
    private final AirQualityService airQualityService;

    public AIController(AIService aiService, AirQualityService airQualityService) {
        this.aiService = aiService;
        this.airQualityService = airQualityService;
    }

    @PostMapping("/explain")
    public ResponseEntity<ApiResponse<AIResponseDTO>> explain(@RequestBody AIExplainRequestDTO request) {
        return ResponseEntity.ok(ApiResponse.success(aiService.explainPrediction(request)));
    }

    @PostMapping("/advisory")
    public ResponseEntity<ApiResponse<AIResponseDTO>> advisory(@RequestBody AIAdvisoryRequestDTO request) {
        if (request.getAqi() == null && request.getCity() != null) {
            CurrentAirQualityDTO curr = airQualityService.getCurrentAirQuality(request.getCity());
            request.setAqi(curr.getAqi());
            request.setAqiCategory(curr.getAqiCategory());
            request.setPrimaryPollutant(curr.getPrimaryPollutant());
            request.setPm25(curr.getPm25());
            request.setPm10(curr.getPm10());
        }
        return ResponseEntity.ok(ApiResponse.success(aiService.generateAdvisory(request)));
    }

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<AIResponseDTO>> chat(@RequestBody AIChatRequestDTO request) {
        // Enforce contextual grounding by injecting latest real observations if not present
        if (request.getContextData() == null || request.getContextData().isEmpty()) {
            String city = request.getSelectedCity() != null ? request.getSelectedCity() : "Delhi";
            CurrentAirQualityDTO curr = airQualityService.getCurrentAirQuality(city);
            Map<String, Object> ctx = new HashMap<>();
            ctx.put("city", curr.getCityName());
            ctx.put("currentAQI", curr.getAqi());
            ctx.put("predictedAQI", curr.getPredictedAqi());
            ctx.put("category", curr.getAqiCategory());
            ctx.put("PM25", curr.getPm25());
            ctx.put("PM10", curr.getPm10());
            ctx.put("NO2", curr.getNo2());
            ctx.put("trend", curr.getTrend());
            request.setContextData(ctx);
        }
        return ResponseEntity.ok(ApiResponse.success(aiService.handleChat(request)));
    }
}
