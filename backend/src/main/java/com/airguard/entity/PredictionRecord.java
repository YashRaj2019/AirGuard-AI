package com.airguard.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "predictions", indexes = {
    @Index(name = "idx_pred_city_time", columnList = "city_id, prediction_time DESC")
})
public class PredictionRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "city_id", nullable = false)
    private City city;

    @Column(name = "prediction_time", nullable = false)
    private OffsetDateTime predictionTime;

    @Column(name = "predicted_aqi", nullable = false)
    private Double predictedAqi;

    @Column(name = "aqi_category", nullable = false, length = 50)
    private String aqiCategory;

    @Column(name = "interval_min")
    private Double intervalMin;

    @Column(name = "interval_max")
    private Double intervalMax;

    @Column(name = "primary_contributor", length = 50)
    private String primaryContributor;

    @Column(name = "model_name", nullable = false, length = 100)
    private String modelName;

    @Column(name = "model_version", nullable = false, length = 50)
    private String modelVersion;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    public PredictionRecord() {}

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

    public OffsetDateTime getPredictionTime() { return predictionTime; }
    public void setPredictionTime(OffsetDateTime predictionTime) { this.predictionTime = predictionTime; }

    public Double getPredictedAqi() { return predictedAqi; }
    public void setPredictedAqi(Double predictedAqi) { this.predictedAqi = predictedAqi; }

    public String getAqiCategory() { return aqiCategory; }
    public void setAqiCategory(String aqiCategory) { this.aqiCategory = aqiCategory; }

    public Double getIntervalMin() { return intervalMin; }
    public void setIntervalMin(Double intervalMin) { this.intervalMin = intervalMin; }

    public Double getIntervalMax() { return intervalMax; }
    public void setIntervalMax(Double intervalMax) { this.intervalMax = intervalMax; }

    public String getPrimaryContributor() { return primaryContributor; }
    public void setPrimaryContributor(String primaryContributor) { this.primaryContributor = primaryContributor; }

    public String getModelName() { return modelName; }
    public void setModelName(String modelName) { this.modelName = modelName; }

    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
