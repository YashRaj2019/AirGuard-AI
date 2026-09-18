package com.airguard.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "model_metrics")
public class ModelMetric {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "model_name", nullable = false, length = 100)
    private String modelName;

    @Column(name = "model_type", nullable = false, length = 50)
    private String modelType;

    @Column(nullable = false)
    private Double mae;

    @Column(nullable = false)
    private Double rmse;

    @Column(nullable = false)
    private Double r2;

    @Column(name = "train_samples", nullable = false)
    private Integer trainSamples;

    @Column(name = "test_samples", nullable = false)
    private Integer testSamples;

    @Column(name = "features_json", columnDefinition = "TEXT")
    private String featuresJson;

    @Column(name = "trained_at")
    private OffsetDateTime trainedAt;

    public ModelMetric() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getModelName() { return modelName; }
    public void setModelName(String modelName) { this.modelName = modelName; }

    public String getModelType() { return modelType; }
    public void setModelType(String modelType) { this.modelType = modelType; }

    public Double getMae() { return mae; }
    public void setMae(Double mae) { this.mae = mae; }

    public Double getRmse() { return rmse; }
    public void setRmse(Double rmse) { this.rmse = rmse; }

    public Double getR2() { return r2; }
    public void setR2(Double r2) { this.r2 = r2; }

    public Integer getTrainSamples() { return trainSamples; }
    public void setTrainSamples(Integer trainSamples) { this.trainSamples = trainSamples; }

    public Integer getTestSamples() { return testSamples; }
    public void setTestSamples(Integer testSamples) { this.testSamples = testSamples; }

    public String getFeaturesJson() { return featuresJson; }
    public void setFeaturesJson(String featuresJson) { this.featuresJson = featuresJson; }

    public OffsetDateTime getTrainedAt() { return trainedAt; }
    public void setTrainedAt(OffsetDateTime trainedAt) { this.trainedAt = trainedAt; }
}
