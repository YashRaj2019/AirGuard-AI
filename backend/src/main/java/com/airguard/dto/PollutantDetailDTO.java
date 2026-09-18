package com.airguard.dto;

public class PollutantDetailDTO {
    private String name;
    private String code; // PM2.5, PM10, NO2, SO2, CO, O3
    private Double currentValue;
    private String unit; // ug/m3 or mg/m3
    private String safeReferenceRange;
    private String status; // Safe, Moderate, Elevated, Hazardous
    private String statusColor;
    private Double subIndex;
    private Double relativeContribution; // % contribution to model or AQI
    private String description;
    private String healthEffects;

    public PollutantDetailDTO() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public Double getCurrentValue() { return currentValue; }
    public void setCurrentValue(Double currentValue) { this.currentValue = currentValue; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public String getSafeReferenceRange() { return safeReferenceRange; }
    public void setSafeReferenceRange(String safeReferenceRange) { this.safeReferenceRange = safeReferenceRange; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getStatusColor() { return statusColor; }
    public void setStatusColor(String statusColor) { this.statusColor = statusColor; }

    public Double getSubIndex() { return subIndex; }
    public void setSubIndex(Double subIndex) { this.subIndex = subIndex; }

    public Double getRelativeContribution() { return relativeContribution; }
    public void setRelativeContribution(Double relativeContribution) { this.relativeContribution = relativeContribution; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getHealthEffects() { return healthEffects; }
    public void setHealthEffects(String healthEffects) { this.healthEffects = healthEffects; }
}
