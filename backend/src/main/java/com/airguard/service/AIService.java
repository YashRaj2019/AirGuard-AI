package com.airguard.service;

import com.airguard.dto.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.*;

@Service
public class AIService {

    private static final Logger log = LoggerFactory.getLogger(AIService.class);

    @Value("${airguard.ai.api-key:}")
    private String apiKey;

    @Value("${airguard.ai.model:gemini-1.5-flash}")
    private String modelName;

    private final WebClient.Builder webClientBuilder;

    public AIService(WebClient.Builder webClientBuilder) {
        this.webClientBuilder = webClientBuilder;
    }

    public AIResponseDTO explainPrediction(AIExplainRequestDTO req) {
        String prompt = String.format(
                "You are an environmental data scientist explaining an ML model's air quality forecast for %s. " +
                "CONTEXT DATA:\n" +
                "- Current AQI: %.1f (%s)\n" +
                "- Predicted AQI: %.1f\n" +
                "- Trend: %s\n" +
                "- PM2.5: %.1f ug/m3, PM10: %.1f ug/m3, NO2: %.1f ug/m3, Wind Speed: %.1f km/h\n" +
                "- Major Contributing Factors in ML Model: %s\n\n" +
                "TASK: Explain in 2-3 concise paragraphs WHY the model predicts the AQI to %s based on these exact numbers. " +
                "Do NOT invent statistics. Mention the physical role of the dominant pollutants and wind dispersion. " +
                "Include a brief environmental advisory. Do NOT provide medical diagnosis.",
                req.getCity(),
                req.getCurrentAqi() != null ? req.getCurrentAqi() : 100.0,
                req.getAqiCategory() != null ? req.getAqiCategory() : "Moderate",
                req.getPredictedAqi() != null ? req.getPredictedAqi() : 110.0,
                req.getTrend() != null ? req.getTrend() : "stable",
                req.getPm25() != null ? req.getPm25() : 45.0,
                req.getPm10() != null ? req.getPm10() : 80.0,
                req.getNo2() != null ? req.getNo2() : 25.0,
                req.getWindSpeed() != null ? req.getWindSpeed() : 6.5,
                req.getMajorFactors() != null ? String.join(", ", req.getMajorFactors()) : "PM2.5, PM10",
                req.getTrend() != null ? req.getTrend() : "change"
        );

        String llmText = callLlm(prompt);
        if (llmText != null && !llmText.isBlank()) {
            return new AIResponseDTO(llmText, "Gemini API (" + modelName + ")", generateRecommendations(req.getAqiCategory()));
        }

        // Domain-aware expert deterministic fallback
        return generateFallbackExplanation(req);
    }

    public AIResponseDTO generateAdvisory(AIAdvisoryRequestDTO req) {
        String prompt = String.format(
                "You are an environmental health advisor for %s with current AQI %d (%s). " +
                "Primary Pollutant: %s, PM2.5: %.1f ug/m3, PM10: %.1f ug/m3. " +
                "Target Audience: %s. " +
                "Provide a clear, evidence-based environmental safety summary. " +
                "Suggest 3-4 actionable outdoor and indoor precautions. " +
                "Do NOT diagnose medical conditions; advise consulting healthcare professionals if experiencing acute symptoms.",
                req.getCity(),
                req.getAqi() != null ? req.getAqi() : 120,
                req.getAqiCategory() != null ? req.getAqiCategory() : "Moderate",
                req.getPrimaryPollutant() != null ? req.getPrimaryPollutant() : "PM2.5",
                req.getPm25() != null ? req.getPm25() : 50.0,
                req.getPm10() != null ? req.getPm10() : 90.0,
                req.getUserGroup() != null ? req.getUserGroup() : "general population"
        );

        String llmText = callLlm(prompt);
        if (llmText != null && !llmText.isBlank()) {
            return new AIResponseDTO(llmText, "Gemini API (" + modelName + ")", generateRecommendations(req.getAqiCategory()));
        }

        return generateFallbackAdvisory(req);
    }

    public AIResponseDTO handleChat(AIChatRequestDTO req) {
        String contextStr = req.getContextData() != null ? req.getContextData().toString() : "No extra context";
        String prompt = String.format(
                "You are 'Ask AirGuard', an intelligent environmental analytics assistant. " +
                "USER QUESTION: \"%s\"\n" +
                "SELECTED CITY: %s\n" +
                "CURRENT SYSTEM CONTEXT DATA (USE THIS REAL DATA ONLY):\n%s\n\n" +
                "INSTRUCTIONS:\n" +
                "- Answer the user's question directly using the provided context.\n" +
                "- If the user asks about why AQI is increasing/decreasing, refer to pollutant levels, wind speed, or lag features.\n" +
                "- Do NOT hallucinate or contradict the provided numbers.\n" +
                "- Keep explanations clear, professional, and accessible to non-technical users.\n" +
                "- Include a note that AirGuard provides environmental guidance, not medical diagnosis.",
                req.getQuestion(),
                req.getSelectedCity(),
                contextStr
        );

        String llmText = callLlm(prompt);
        if (llmText != null && !llmText.isBlank()) {
            return new AIResponseDTO(llmText, "Gemini API (" + modelName + ")", generateRecommendations("Moderate"));
        }

        return generateFallbackChatResponse(req);
    }

    private String callLlm(String prompt) {
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.contains("your_")) {
            return null; // Gracefully route to expert fallback
        }

        try {
            String url = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                    modelName, apiKey.trim());

            Map<String, Object> payload = Map.of(
                    "contents", List.of(
                            Map.of("parts", List.of(Map.of("text", prompt)))
                    ),
                    "generationConfig", Map.of(
                            "temperature", 0.3,
                            "maxOutputTokens", 600
                    )
            );

            WebClient client = webClientBuilder.build();
            Map<?, ?> response = client.post()
                    .uri(url)
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofSeconds(8))
                    .block();

            if (response != null && response.containsKey("candidates")) {
                List<?> candidates = (List<?>) response.get("candidates");
                if (!candidates.isEmpty()) {
                    Map<?, ?> first = (Map<?, ?>) candidates.get(0);
                    Map<?, ?> content = (Map<?, ?>) first.get("content");
                    if (content != null && content.containsKey("parts")) {
                        List<?> parts = (List<?>) content.get("parts");
                        if (!parts.isEmpty()) {
                            Map<?, ?> p = (Map<?, ?>) parts.get(0);
                            return (String) p.get("text");
                        }
                    }
                }
            }
        } catch (Exception ex) {
            log.warn("Direct LLM API call failed ({}), activating domain explanation engine: {}",
                    ex.getClass().getSimpleName(), ex.getMessage());
        }

        return null;
    }

    private AIResponseDTO generateFallbackExplanation(AIExplainRequestDTO req) {
        String city = req.getCity();
        double currentAqi = req.getCurrentAqi() != null ? req.getCurrentAqi() : 100.0;
        double predAqi = req.getPredictedAqi() != null ? req.getPredictedAqi() : 110.0;
        double diff = predAqi - currentAqi;
        String dir = diff > 5.0 ? "increase" : diff < -5.0 ? "decrease" : "remain relatively stable";

        String topFactors = req.getMajorFactors() != null && !req.getMajorFactors().isEmpty()
                ? String.join(" and ", req.getMajorFactors().subList(0, Math.min(2, req.getMajorFactors().size())))
                : "fine particulate matter (PM2.5) and 24-hour historical inertia";

        String explanation = String.format(
                "Based on recent sensor measurements and historical patterns, the machine learning model forecasts that the Air Quality Index for %s will %s over the next 24 hours, moving from approximately %.1f to %.1f (%s).\n\n" +
                "Feature attribution indicates that %s have the strongest relative influence on this prediction. " +
                "At present, PM2.5 levels (%.1f µg/m³) exceed recommended baseline thresholds, contributing heavily to the model's regression output. " +
                (req.getWindSpeed() != null && req.getWindSpeed() < 8.0
                        ? "Furthermore, localized low wind velocities (around " + req.getWindSpeed() + " km/h) limit atmospheric ventilation, promoting the retention of particulate pollutants in the urban boundary layer."
                        : "Moderate wind velocities are assisting in atmospheric dispersion, preventing sharp exponential accumulation.") +
                "\n\nNote: This assessment reflects statistical regression relationships from atmospheric data and is intended for environmental awareness, not clinical medical assessment.",
                city, dir, currentAqi, predAqi, req.getAqiCategory() != null ? req.getAqiCategory() : "Moderate",
                topFactors, req.getPm25() != null ? req.getPm25() : 40.0
        );

        return new AIResponseDTO(explanation, "AirGuard Expert Knowledge Engine", generateRecommendations(req.getAqiCategory()));
    }

    private AIResponseDTO generateFallbackAdvisory(AIAdvisoryRequestDTO req) {
        String cat = req.getAqiCategory() != null ? req.getAqiCategory() : "Moderate";
        String city = req.getCity() != null ? req.getCity() : "Current City";

        String summary;
        if (cat.equalsIgnoreCase("Good")) {
            summary = String.format("Air quality in %s is currently optimal (AQI %d). Atmospheric pollutant concentrations are well within international environmental benchmarks, making outdoor recreation and ventilation safe for all demographics.", city, req.getAqi());
        } else if (cat.equalsIgnoreCase("Moderate")) {
            summary = String.format("Air quality in %s is acceptable (AQI %d). However, elevated concentrations of %s (%.1f µg/m³) may produce mild sensitivity for individuals with hyperreactive airways or severe allergies.", city, req.getAqi(), req.getPrimaryPollutant(), req.getPm25() != null ? req.getPm25() : 25.0);
        } else if (cat.equalsIgnoreCase("Unhealthy for Sensitive Groups")) {
            summary = String.format("Caution is advised in %s today (AQI %d). Fine particulates (%s: %.1f µg/m³) have reached elevated levels. Vulnerable groups—including children, seniors, and individuals with cardiovascular or pulmonary conditions—should reduce prolonged high-intensity outdoor exertion.", city, req.getAqi(), req.getPrimaryPollutant(), req.getPm25() != null ? req.getPm25() : 45.0);
        } else {
            summary = String.format("High pollution warning for %s (AQI %d, %s). Ambient concentrations of %s (%.1f µg/m³) pose acute health risks across the general public. Ambient outdoor exercise should be curtailed, and indoor air purification is strongly advised.", city, req.getAqi(), cat, req.getPrimaryPollutant(), req.getPm25() != null ? req.getPm25() : 95.0);
        }

        return new AIResponseDTO(summary, "AirGuard Environmental Health Rules Engine", generateRecommendations(cat));
    }

    private AIResponseDTO generateFallbackChatResponse(AIChatRequestDTO req) {
        String q = req.getQuestion().toLowerCase();
        String city = req.getSelectedCity() != null ? req.getSelectedCity() : "the selected city";
        String text;

        if (q.contains("pm2.5") || q.contains("pm25") || q.contains("pm 2.5")) {
            text = "PM2.5 refers to fine inhalable particles with diameters of 2.5 micrometers or smaller (about 30 times smaller than a human hair). Because of their microscopic scale, they bypass nasal filtration and penetrate into alveolar tissue and the bloodstream. In our predictive model, PM2.5 consistently holds the highest feature importance (typically 40-50%) for AQI determination.";
        } else if (q.contains("why") && (q.contains("high") || q.contains("increase") || q.contains("bad"))) {
            text = String.format("Air pollution in %s is driven primarily by a combination of high particulate emissions (PM2.5 and PM10) and meteorological stagnation. When wind speeds decrease below 8-10 km/h or temperature drops at night, a thermal inversion can trap vehicle exhaust, construction dust, and industrial smoke near ground level.", city);
        } else if (q.contains("compare")) {
            text = "When comparing cities, AirGuard analyzes particulate concentrations (PM2.5/PM10), gaseous precursors (NO2/SO2/O3), and meteorological dispersion factors. Cities with higher wind circulation or coastal seabreezes generally maintain lower AQI than landlocked urban basins with high vehicular traffic.";
        } else if (q.contains("forecast") || q.contains("tomorrow") || q.contains("predict")) {
            text = String.format("The AirGuard regression pipeline calculates tomorrow's forecast for %s by evaluating 24-hour lag trends, 6-hour moving averages, cyclical diurnal patterns, and anticipated atmospheric dispersion. You can inspect the exact confidence interval and contributing factor bars on the Forecast tab.", city);
        } else {
            text = String.format("AirGuard AI tracks real-time atmospheric data for %s across key criteria pollutants: PM2.5, PM10, NO2, SO2, CO, and Ozone. The machine learning pipeline processes these inputs to deliver forward-looking AQI predictions and explainable factor attribution. How else can I assist your environmental analysis?", city);
        }

        return new AIResponseDTO(text, "AirGuard Conversational Core", generateRecommendations("Moderate"));
    }

    private List<String> generateRecommendations(String aqiCategory) {
        if (aqiCategory == null) aqiCategory = "Moderate";
        List<String> list = new ArrayList<>();
        switch (aqiCategory.toLowerCase()) {
            case "good":
                list.add("Ideal conditions for outdoor sports, cycling, and running.");
                list.add("Open windows to allow fresh natural indoor ventilation.");
                list.add("Standard day-to-day activities without environmental precautions.");
                break;
            case "moderate":
                list.add("Unusually sensitive individuals should monitor respiratory comfort during outdoor activities.");
                list.add("Keep windows open during peak midday ventilation hours.");
                list.add("Consider regular hydration to assist mucosal clearance.");
                break;
            case "unhealthy for sensitive groups":
                list.add("Sensitive groups (asthma, COPD, seniors, children) should limit prolonged outdoor exertion.");
                list.add("Keep quick-relief inhalers and medications accessible if prescribed.");
                list.add("Consider running HEPA air filtration in primary bedrooms.");
                list.add("Close windows during peak morning and evening traffic congestion.");
                break;
            case "unhealthy":
                list.add("Wear a certified particulate respirator (N95 or FFP2) during extended outdoor transit.");
                list.add("Avoid rigorous outdoor aerobic workouts; substitute with indoor activities.");
                list.add("Keep indoor doors and windows sealed; activate HEPA purification.");
                list.add("Sensitive individuals should remain indoors in temperature-controlled spaces.");
                break;
            default: // Very Unhealthy & Hazardous
                list.add("HEALTH ALERT: Avoid all non-essential outdoor exposure.");
                list.add("Wear tightly-fitted N95/N99 respirators whenever outdoors.");
                list.add("Run high-efficiency indoor air purifiers continuously.");
                list.add("Seek medical evaluation if experiencing persistent chest discomfort, wheezing, or shortness of breath.");
                break;
        }
        return list;
    }
}
