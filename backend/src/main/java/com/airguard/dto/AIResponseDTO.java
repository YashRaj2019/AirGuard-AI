package com.airguard.dto;

import java.util.List;

public class AIResponseDTO {
    private String response;
    private String modelUsed; // e.g., "gemini-1.5-flash" or "AirGuard Expert Rule Engine"
    private List<String> recommendations;
    private String disclaimer;

    public AIResponseDTO() {
        this.disclaimer = "AirGuard AI provides general environmental-health information and model forecasts based on ambient sensors. It does not provide medical diagnosis or personalized medical advice. For specific health concerns, consult a qualified healthcare provider.";
    }

    public AIResponseDTO(String response, String modelUsed, List<String> recommendations) {
        this();
        this.response = response;
        this.modelUsed = modelUsed;
        this.recommendations = recommendations;
    }

    public String getResponse() { return response; }
    public void setResponse(String response) { this.response = response; }

    public String getModelUsed() { return modelUsed; }
    public void setModelUsed(String modelUsed) { this.modelUsed = modelUsed; }

    public List<String> getRecommendations() { return recommendations; }
    public void setRecommendations(List<String> recommendations) { this.recommendations = recommendations; }

    public String getDisclaimer() { return disclaimer; }
    public void setDisclaimer(String disclaimer) { this.disclaimer = disclaimer; }
}
