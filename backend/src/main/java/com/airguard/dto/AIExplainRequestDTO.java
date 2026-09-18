package com.airguard.dto;

import java.util.List;

public class AIExplainRequestDTO {
    private String city;
    private Double currentAqi;
    private Double predictedAqi;
    private String aqiCategory;
    private Double pm25;
    private Double pm10;
    private Double no2;
    private Double windSpeed;
    private String trend;
    private List<String> majorFactors;

    public AIExplainRequestDTO() {}

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public Double getCurrentAqi() { return currentAqi; }
    public void setCurrentAqi(Double currentAqi) { this.currentAqi = currentAqi; }

    public Double getPredictedAqi() { return predictedAqi; }
    public void setPredictedAqi(Double predictedAqi) { this.predictedAqi = predictedAqi; }

    public String getAqiCategory() { return aqiCategory; }
    public void setAqiCategory(String aqiCategory) { this.aqiCategory = aqiCategory; }

    public Double getPm25() { return pm25; }
    public void setPm25(Double pm25) { this.pm25 = pm25; }

    public Double getPm10() { return pm10; }
    public void setPm10(Double pm10) { this.pm10 = pm10; }

    public Double getNo2() { return no2; }
    public void setNo2(Double no2) { this.no2 = no2; }

    public Double getWindSpeed() { return windSpeed; }
    public void setWindSpeed(Double windSpeed) { this.windSpeed = windSpeed; }

    public String getTrend() { return trend; }
    public void setTrend(String trend) { this.trend = trend; }

    public List<String> getMajorFactors() { return majorFactors; }
    public void setMajorFactors(List<String> majorFactors) { this.majorFactors = majorFactors; }
}
