package com.airguard.dto;

import java.util.List;

public class CityCompareDTO {
    private List<CurrentAirQualityDTO> cities;
    private String cleanerCity;
    private Double aqiDifference;
    private String aiComparisonAnalysis;

    public CityCompareDTO() {}

    public CityCompareDTO(List<CurrentAirQualityDTO> cities, String cleanerCity, Double aqiDifference, String aiComparisonAnalysis) {
        this.cities = cities;
        this.cleanerCity = cleanerCity;
        this.aqiDifference = aqiDifference;
        this.aiComparisonAnalysis = aiComparisonAnalysis;
    }

    public List<CurrentAirQualityDTO> getCities() { return cities; }
    public void setCities(List<CurrentAirQualityDTO> cities) { this.cities = cities; }

    public String getCleanerCity() { return cleanerCity; }
    public void setCleanerCity(String cleanerCity) { this.cleanerCity = cleanerCity; }

    public Double getAqiDifference() { return aqiDifference; }
    public void setAqiDifference(Double aqiDifference) { this.aqiDifference = aqiDifference; }

    public String getAiComparisonAnalysis() { return aiComparisonAnalysis; }
    public void setAiComparisonAnalysis(String aiComparisonAnalysis) { this.aiComparisonAnalysis = aiComparisonAnalysis; }
}
