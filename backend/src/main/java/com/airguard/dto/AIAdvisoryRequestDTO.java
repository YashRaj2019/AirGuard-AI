package com.airguard.dto;

import java.util.List;

public class AIAdvisoryRequestDTO {
    private String city;
    private Integer aqi;
    private String aqiCategory;
    private String primaryPollutant;
    private Double pm25;
    private Double pm10;
    private String userGroup; // "general", "sensitive", "outdoor_active", "children_elderly"

    public AIAdvisoryRequestDTO() {}

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public Integer getAqi() { return aqi; }
    public void setAqi(Integer aqi) { this.aqi = aqi; }

    public String getAqiCategory() { return aqiCategory; }
    public void setAqiCategory(String aqiCategory) { this.aqiCategory = aqiCategory; }

    public String getPrimaryPollutant() { return primaryPollutant; }
    public void setPrimaryPollutant(String primaryPollutant) { this.primaryPollutant = primaryPollutant; }

    public Double getPm25() { return pm25; }
    public void setPm25(Double pm25) { this.pm25 = pm25; }

    public Double getPm10() { return pm10; }
    public void setPm10(Double pm10) { this.pm10 = pm10; }

    public String getUserGroup() { return userGroup; }
    public void setUserGroup(String userGroup) { this.userGroup = userGroup; }
}
