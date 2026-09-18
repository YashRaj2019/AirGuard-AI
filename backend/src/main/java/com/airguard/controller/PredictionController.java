package com.airguard.controller;

import com.airguard.dto.*;
import com.airguard.entity.City;
import com.airguard.entity.PredictionRecord;
import com.airguard.repository.CityRepository;
import com.airguard.repository.PredictionRecordRepository;
import com.airguard.service.AIService;
import com.airguard.service.AirQualityService;
import com.airguard.service.MLServiceClient;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping({"/api", ""})
public class PredictionController {

    private final MLServiceClient mlServiceClient;
    private final AirQualityService airQualityService;
    private final AIService aiService;
    private final CityRepository cityRepository;
    private final PredictionRecordRepository predictionRecordRepository;

    public PredictionController(MLServiceClient mlServiceClient,
                                AirQualityService airQualityService,
                                AIService aiService,
                                CityRepository cityRepository,
                                PredictionRecordRepository predictionRecordRepository) {
        this.mlServiceClient = mlServiceClient;
        this.airQualityService = airQualityService;
        this.aiService = aiService;
        this.cityRepository = cityRepository;
        this.predictionRecordRepository = predictionRecordRepository;
    }

    @PostMapping("/ml/predict")
    @Transactional
    public ResponseEntity<ApiResponse<PredictResponseDTO>> predict(@Valid @RequestBody PredictRequestDTO request) {
        // If pollutant readings not provided in request, auto-populate from latest database/sensor reading
        if (request.getPm25() == null || request.getPm10() == null) {
            CurrentAirQualityDTO curr = airQualityService.getCurrentAirQuality(request.getCity());
            request.setPm25(curr.getPm25());
            request.setPm10(curr.getPm10());
            request.setNo2(curr.getNo2());
            request.setSo2(curr.getSo2());
            request.setCo(curr.getCo());
            request.setO3(curr.getO3());
            request.setTemperature(curr.getTemperature());
            request.setHumidity(curr.getHumidity());
            request.setWindSpeed(curr.getWindSpeed());
        }

        // 1. Machine Learning Prediction
        PredictResponseDTO predResponse = mlServiceClient.predict(request);

        // 2. AI Contextual Explanation
        AIExplainRequestDTO explainReq = new AIExplainRequestDTO();
        explainReq.setCity(request.getCity());
        explainReq.setCurrentAqi(request.getPm25() != null ? request.getPm25() * 1.5 : 100.0);
        explainReq.setPredictedAqi(predResponse.getPredictedAqi());
        explainReq.setAqiCategory(predResponse.getAqiCategory());
        explainReq.setPm25(request.getPm25());
        explainReq.setPm10(request.getPm10());
        explainReq.setNo2(request.getNo2());
        explainReq.setWindSpeed(request.getWindSpeed());
        explainReq.setMajorFactors(predResponse.getContributingFactors() != null
                ? predResponse.getContributingFactors().stream().map(PredictResponseDTO.ContributingFactorDTO::getFeature).collect(Collectors.toList())
                : List.of("PM2.5", "PM10"));

        AIResponseDTO aiExp = aiService.explainPrediction(explainReq);
        predResponse.setAiExplanation(aiExp.getResponse());

        // 3. Persist Prediction to Database
        cityRepository.findByNameIgnoreCase(request.getCity()).ifPresent(city -> {
            PredictionRecord record = new PredictionRecord();
            record.setCity(city);
            record.setPredictionTime(OffsetDateTime.now().plusHours(24));
            double predVal = predResponse.getPredictedAqi() != null ? predResponse.getPredictedAqi() : 100.0;
            record.setPredictedAqi(predVal);
            record.setAqiCategory(predResponse.getAqiCategory() != null ? predResponse.getAqiCategory() : "Moderate");
            if (predResponse.getPredictionInterval() != null && predResponse.getPredictionInterval().size() >= 2) {
                record.setIntervalMin(predResponse.getPredictionInterval().get(0));
                record.setIntervalMax(predResponse.getPredictionInterval().get(1));
            }
            if (predResponse.getContributingFactors() != null && !predResponse.getContributingFactors().isEmpty()) {
                record.setPrimaryContributor(predResponse.getContributingFactors().get(0).getFeature());
            }
            record.setModelName(predResponse.getModelName() != null ? predResponse.getModelName() : "Baseline (Ridge Regression)");
            record.setModelVersion(predResponse.getModelVersion() != null ? predResponse.getModelVersion() : "1.2.0");
            predictionRecordRepository.save(record);
        });

        return ResponseEntity.ok(ApiResponse.success("Prediction generated successfully", predResponse));
    }

    @GetMapping("/ml/model-performance")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getModelPerformance() {
        return ResponseEntity.ok(ApiResponse.success(mlServiceClient.getModelPerformance()));
    }

    @GetMapping("/predictions/history")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<PredictResponseDTO>>> getPredictionHistory(@RequestParam(defaultValue = "15") int limit) {
        List<PredictionRecord> records = predictionRecordRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, Math.min(limit, 50)));

        List<PredictResponseDTO> dtos = records.stream().map(r -> {
            PredictResponseDTO d = new PredictResponseDTO();
            d.setCity(r.getCity().getName());
            d.setPredictedAqi(r.getPredictedAqi());
            d.setAqiCategory(r.getAqiCategory());
            d.setModelName(r.getModelName());
            d.setModelVersion(r.getModelVersion());
            d.setPredictionTime(r.getPredictionTime().toString());
            if (r.getIntervalMin() != null && r.getIntervalMax() != null) {
                d.setPredictionInterval(List.of(r.getIntervalMin(), r.getIntervalMax()));
            }
            if (r.getPrimaryContributor() != null) {
                d.setContributingFactors(List.of(new PredictResponseDTO.ContributingFactorDTO(r.getPrimaryContributor(), 45.0, "primary")));
            }
            return d;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(dtos));
    }
}
