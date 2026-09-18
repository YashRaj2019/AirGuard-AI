package com.airguard.dto;

import java.util.Map;

public class AIChatRequestDTO {
    private String question;
    private String selectedCity;
    private Map<String, Object> contextData;

    public AIChatRequestDTO() {}

    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }

    public String getSelectedCity() { return selectedCity; }
    public void setSelectedCity(String selectedCity) { this.selectedCity = selectedCity; }

    public Map<String, Object> getContextData() { return contextData; }
    public void setContextData(Map<String, Object> contextData) { this.contextData = contextData; }
}
