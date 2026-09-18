package com.airguard.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "air_quality_records", indexes = {
    @Index(name = "idx_aq_city_timestamp", columnList = "city_id, timestamp DESC"),
    @Index(name = "idx_aq_timestamp", columnList = "timestamp")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uq_city_timestamp", columnNames = {"city_id", "timestamp"})
})
public class AirQualityRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "city_id", nullable = false)
    private City city;

    @Column(nullable = false)
    private OffsetDateTime timestamp;

    private Double pm25;
    private Double pm10;
    private Double no2;
    private Double so2;
    private Double co;
    private Double o3;

    private Double temperature;
    private Double humidity;
    private Double windSpeed;

    @Column(nullable = false)
    private Integer aqi;

    @Column(name = "aqi_category", nullable = false, length = 50)
    private String aqiCategory;

    @Column(name = "primary_pollutant", length = 20)
    private String primaryPollutant;

    @Column(name = "data_source", length = 50)
    private String dataSource;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    public AirQualityRecord() {}

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = OffsetDateTime.now();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public City getCity() { return city; }
    public void setCity(City city) { this.city = city; }

    public OffsetDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(OffsetDateTime timestamp) { this.timestamp = timestamp; }

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

    public Integer getAqi() { return aqi; }
    public void setAqi(Integer aqi) { this.aqi = aqi; }

    public String getAqiCategory() { return aqiCategory; }
    public void setAqiCategory(String aqiCategory) { this.aqiCategory = aqiCategory; }

    public String getPrimaryPollutant() { return primaryPollutant; }
    public void setPrimaryPollutant(String primaryPollutant) { this.primaryPollutant = primaryPollutant; }

    public String getDataSource() { return dataSource; }
    public void setDataSource(String dataSource) { this.dataSource = dataSource; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
