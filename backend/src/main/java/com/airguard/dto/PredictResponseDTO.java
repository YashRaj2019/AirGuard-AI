package com.airguard.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class PredictResponseDTO {
    private String city;

    @JsonAlias({"predicted_aqi", "predictedAqi"})
    private Double predictedAqi;

    @JsonAlias({"aqi_category", "aqiCategory"})
    private String aqiCategory;

    @JsonAlias({"category_color", "categoryColor"})
    private String categoryColor;

    @JsonAlias({"category_description", "categoryDescription"})
    private String categoryDescription;

    @JsonAlias({"prediction_interval", "predictionInterval"})
    private List<Double> predictionInterval;

    @JsonAlias({"model_name", "modelName"})
    private String modelName;

    @JsonAlias({"model_version", "modelVersion"})
    private String modelVersion;

    @JsonAlias({"contributing_factors", "contributingFactors"})
    private List<ContributingFactorDTO> contributingFactors;

    @JsonAlias({"prediction_time", "predictionTime"})
    private String predictionTime;

    @JsonAlias({"ai_explanation", "aiExplanation"})
    private String aiExplanation;

    public static class ContributingFactorDTO {
        private String feature;
        private Double importance;

        @JsonAlias({"raw_key", "rawKey"})
        private String rawKey;

        public ContributingFactorDTO() {}

        public ContributingFactorDTO(String feature, Double importance, String rawKey) {
            this.feature = feature;
            this.importance = importance;
            this.rawKey = rawKey;
        }

        public String getFeature() { return feature; }
        public void setFeature(String feature) { this.feature = feature; }

        public Double getImportance() { return importance; }
        public void setImportance(Double importance) { this.importance = importance; }

        public String getRawKey() { return rawKey; }
        public void setRawKey(String rawKey) { this.rawKey = rawKey; }
    }

    public PredictResponseDTO() {}

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public Double getPredictedAqi() { return predictedAqi; }
    public void setPredictedAqi(Double predictedAqi) { this.predictedAqi = predictedAqi; }

    public String getAqiCategory() { return aqiCategory; }
    public void setAqiCategory(String aqiCategory) { this.aqiCategory = aqiCategory; }

    public String getCategoryColor() { return categoryColor; }
    public void setCategoryColor(String categoryColor) { this.categoryColor = categoryColor; }

    public String getCategoryDescription() { return categoryDescription; }
    public void setCategoryDescription(String categoryDescription) { this.categoryDescription = categoryDescription; }

    public List<Double> getPredictionInterval() { return predictionInterval; }
    public void setPredictionInterval(List<Double> predictionInterval) { this.predictionInterval = predictionInterval; }

    public String getModelName() { return modelName; }
    public void setModelName(String modelName) { this.modelName = modelName; }

    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }

    public List<ContributingFactorDTO> getContributingFactors() { return contributingFactors; }
    public void setContributingFactors(List<ContributingFactorDTO> contributingFactors) { this.contributingFactors = contributingFactors; }

    public String getPredictionTime() { return predictionTime; }
    public void setPredictionTime(String predictionTime) { this.predictionTime = predictionTime; }

    public String getAiExplanation() { return aiExplanation; }
    public void setAiExplanation(String aiExplanation) { this.aiExplanation = aiExplanation; }
}
