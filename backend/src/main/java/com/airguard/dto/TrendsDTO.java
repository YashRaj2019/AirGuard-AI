package com.airguard.dto;

import java.util.List;
import java.util.Map;

public class TrendsDTO {
    private String cityName;
    private Double currentAqi;
    private Double average24hAqi;
    private Double average7dAqi;
    private Double average30dAqi;
    private String trendDirection; // "increasing", "stable", "decreasing"
    private Double percentageChange24h;
    private List<DailySummary> dailyAverages;
    private Map<String, Double> pollutantAverages;

    public static class DailySummary {
        private String date;
        private Double avgAqi;
        private String category;
        private Double avgPm25;
        private Double avgPm10;

        public DailySummary() {}

        public DailySummary(String date, Double avgAqi, String category, Double avgPm25, Double avgPm10) {
            this.date = date;
            this.avgAqi = avgAqi;
            this.category = category;
            this.avgPm25 = avgPm25;
            this.avgPm10 = avgPm10;
        }

        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }

        public Double getAvgAqi() { return avgAqi; }
        public void setAvgAqi(Double avgAqi) { this.avgAqi = avgAqi; }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }

        public Double getAvgPm25() { return avgPm25; }
        public void setAvgPm25(Double avgPm25) { this.avgPm25 = avgPm25; }

        public Double getAvgPm10() { return avgPm10; }
        public void setAvgPm10(Double avgPm10) { this.avgPm10 = avgPm10; }
    }

    public TrendsDTO() {}

    public String getCityName() { return cityName; }
    public void setCityName(String cityName) { this.cityName = cityName; }

    public Double getCurrentAqi() { return currentAqi; }
    public void setCurrentAqi(Double currentAqi) { this.currentAqi = currentAqi; }

    public Double getAverage24hAqi() { return average24hAqi; }
    public void setAverage24hAqi(Double average24hAqi) { this.average24hAqi = average24hAqi; }

    public Double getAverage7dAqi() { return average7dAqi; }
    public void setAverage7dAqi(Double average7dAqi) { this.average7dAqi = average7dAqi; }

    public Double getAverage30dAqi() { return average30dAqi; }
    public void setAverage30dAqi(Double average30dAqi) { this.average30dAqi = average30dAqi; }

    public String getTrendDirection() { return trendDirection; }
    public void setTrendDirection(String trendDirection) { this.trendDirection = trendDirection; }

    public Double getPercentageChange24h() { return percentageChange24h; }
    public void setPercentageChange24h(Double percentageChange24h) { this.percentageChange24h = percentageChange24h; }

    public List<DailySummary> getDailyAverages() { return dailyAverages; }
    public void setDailyAverages(List<DailySummary> dailyAverages) { this.dailyAverages = dailyAverages; }

    public Map<String, Double> getPollutantAverages() { return pollutantAverages; }
    public void setPollutantAverages(Map<String, Double> pollutantAverages) { this.pollutantAverages = pollutantAverages; }
}
