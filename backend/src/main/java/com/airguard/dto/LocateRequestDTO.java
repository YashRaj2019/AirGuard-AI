package com.airguard.dto;

import jakarta.validation.constraints.NotNull;

public class LocateRequestDTO {

    @NotNull(message = "Latitude is required")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    private Double longitude;

    private String name;

    public LocateRequestDTO() {}

    public LocateRequestDTO(Double latitude, Double longitude, String name) {
        this.latitude = latitude;
        this.longitude = longitude;
        this.name = name;
    }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
