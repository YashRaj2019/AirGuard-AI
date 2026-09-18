package com.airguard.dto;

import java.time.OffsetDateTime;

public class CurrentAirQualityDTO {
    private String cityName;
    private String state;
    private String country;
    private Double latitude;
    private Double longitude;
    private OffsetDateTime timestamp;

    private Integer aqi;
    private String aqiCategory;
    private String categoryColor;
    private String categoryDescription;
    private String primaryPollutant;
    private String trend;

    private Double pm25;
    private Double pm10;
    private Double no2;
    private Double so2;
    private Double co;
    private Double o3;

    private Double temperature;
    private Double humidity;
    private Double windSpeed;

    private Double predictedAqi;
    private String predictedCategory;
    private String dataSource;

    public CurrentAirQualityDTO() {}

    // Getters and Setters
    public String getCityName() { return cityName; }
    public void setCityName(String cityName) { this.cityName = cityName; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public OffsetDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(OffsetDateTime timestamp) { this.timestamp = timestamp; }

    public Integer getAqi() { return aqi; }
    public void setAqi(Integer aqi) { this.aqi = aqi; }

    public String getAqiCategory() { return aqiCategory; }
    public void setAqiCategory(String aqiCategory) { this.aqiCategory = aqiCategory; }

    public String getCategoryColor() { return categoryColor; }
    public void setCategoryColor(String categoryColor) { this.categoryColor = categoryColor; }

    public String getCategoryDescription() { return categoryDescription; }
    public void setCategoryDescription(String categoryDescription) { this.categoryDescription = categoryDescription; }

    public String getPrimaryPollutant() { return primaryPollutant; }
    public void setPrimaryPollutant(String primaryPollutant) { this.primaryPollutant = primaryPollutant; }

    public String getTrend() { return trend; }
    public void setTrend(String trend) { this.trend = trend; }

    public Double getPm25() { return pm25; }
    public void setPm25(Double pm25) { this.pm25 = pm25; }

    public Double getPm10() { return pm10; }
    public void setPm10(Double pm10) { this.pm10 = pm10; }

    public Double getNo2() { return no2; }
    public void setNo2(Double no2) { this.no2 = no2; }

    public Double getSo2() { return so2; }
    public void setSo2(Double so2) { this.so2 = so2; }

    public Double getCo() { return co; }
    public void setCo(Double co) { this.co = co; }

    public Double getO3() { return o3; }
    public void setO3(Double o3) { this.o3 = o3; }

    public Double getTemperature() { return temperature; }
    public void setTemperature(Double temperature) { this.temperature = temperature; }

    public Double getHumidity() { return humidity; }
    public void setHumidity(Double humidity) { this.humidity = humidity; }

    public Double getWindSpeed() { return windSpeed; }
    public void setWindSpeed(Double windSpeed) { this.windSpeed = windSpeed; }

    public Double getPredictedAqi() { return predictedAqi; }
    public void setPredictedAqi(Double predictedAqi) { this.predictedAqi = predictedAqi; }

    public String getPredictedCategory() { return predictedCategory; }
    public void setPredictedCategory(String predictedCategory) { this.predictedCategory = predictedCategory; }

    public String getDataSource() { return dataSource; }
    public void setDataSource(String dataSource) { this.dataSource = dataSource; }
}
