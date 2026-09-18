package com.airguard.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public class PredictRequestDTO {
    @NotNull(message = "City is required")
    private String city;

    private Double pm25;
    private Double pm10;
    private Double no2;
    private Double so2;
    private Double co;
    private Double o3;
    private Double temperature;
    private Double humidity;
    private Double windSpeed;
    private List<Double> recentPm25History;
    private String modelName;

    public PredictRequestDTO() {}

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

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

    public List<Double> getRecentPm25History() { return recentPm25History; }
    public void setRecentPm25History(List<Double> recentPm25History) { this.recentPm25History = recentPm25History; }

    public String getModelName() { return modelName; }
    public void setModelName(String modelName) { this.modelName = modelName; }
}
