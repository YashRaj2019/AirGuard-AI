package com.airguard.service;

import org.springframework.stereotype.Component;

@Component
public class AQICalculator {

    // US EPA Breakpoints for PM2.5 (ug/m3) -> (C_low, C_high, I_low, I_high)
    private static final double[][] PM25_BP = {
            {0.0, 12.0, 0, 50},
            {12.1, 35.4, 51, 100},
            {35.5, 55.4, 101, 150},
            {55.5, 150.4, 151, 200},
            {150.5, 250.4, 201, 300},
            {250.5, 500.4, 301, 500}
    };

    // US EPA Breakpoints for PM10 (ug/m3)
    private static final double[][] PM10_BP = {
            {0, 54, 0, 50},
            {55, 154, 51, 100},
            {155, 254, 101, 150},
            {255, 354, 151, 200},
            {355, 424, 201, 300},
            {425, 604, 301, 500}
    };

    // US EPA Breakpoints for Ozone (ug/m3)
    private static final double[][] O3_BP = {
            {0, 105, 0, 50},
            {106, 140, 51, 100},
            {141, 170, 101, 150},
            {171, 210, 151, 200},
            {211, 400, 201, 300},
            {401, 800, 301, 500}
    };

    // US EPA Breakpoints for NO2 (ug/m3)
    private static final double[][] NO2_BP = {
            {0, 53, 0, 50},
            {54, 100, 51, 100},
            {101, 360, 101, 150},
            {361, 649, 151, 200},
            {650, 1249, 201, 300},
            {1250, 2049, 301, 500}
    };

    public double calculateSubIndex(Double concentration, double[][] breakpoints) {
        if (concentration == null || concentration < 0) return 0.0;
        for (double[] bp : breakpoints) {
            double cLow = bp[0], cHigh = bp[1], iLow = bp[2], iHigh = bp[3];
            if (concentration >= cLow && concentration <= cHigh) {
                return ((iHigh - iLow) / (cHigh - cLow)) * (concentration - cLow) + iLow;
            }
        }
        double[] last = breakpoints[breakpoints.length - 1];
        if (concentration > last[1]) {
            return Math.min(500.0, ((last[3] - last[2]) / (last[1] - last[0])) * (concentration - last[0]) + last[2]);
        }
        return 0.0;
    }

    public double getPm25SubIndex(Double pm25) { return calculateSubIndex(pm25, PM25_BP); }
    public double getPm10SubIndex(Double pm10) { return calculateSubIndex(pm10, PM10_BP); }
    public double getO3SubIndex(Double o3) { return calculateSubIndex(o3, O3_BP); }
    public double getNo2SubIndex(Double no2) { return calculateSubIndex(no2, NO2_BP); }

    public String getCategory(double aqi) {
        if (aqi <= 50) return "Good";
        if (aqi <= 100) return "Moderate";
        if (aqi <= 150) return "Unhealthy for Sensitive Groups";
        if (aqi <= 200) return "Unhealthy";
        if (aqi <= 300) return "Very Unhealthy";
        return "Hazardous";
    }

    public String getColor(double aqi) {
        if (aqi <= 50) return "#10B981"; // Emerald green
        if (aqi <= 100) return "#FBBF24"; // Amber
        if (aqi <= 150) return "#F97316"; // Orange
        if (aqi <= 200) return "#EF4444"; // Red
        if (aqi <= 300) return "#8B5CF6"; // Purple
        return "#7E22CE"; // Deep violet
    }

    public String getDescription(double aqi) {
        if (aqi <= 50) return "Air quality is satisfactory, and air pollution poses little or no risk.";
        if (aqi <= 100) return "Air quality is acceptable; however, some pollutants may pose a moderate concern for sensitive individuals.";
        if (aqi <= 150) return "Members of sensitive groups may experience health effects; general public is less likely to be affected.";
        if (aqi <= 200) return "Everyone may begin to experience adverse effects; sensitive groups may experience serious health effects.";
        if (aqi <= 300) return "Health alert: The risk of health effects is heightened across the entire population.";
        return "Health warning of emergency conditions: The entire population is likely to be affected.";
    }
}
