package com.airguard.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class AddCityRequestDTO {

    @NotBlank(message = "City name is required")
    private String name;

    private String state;

    @NotBlank(message = "Country is required")
    private String country;

    @NotNull(message = "Latitude is required")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    private Double longitude;

    private String timezone;

    public AddCityRequestDTO() {}

    public AddCityRequestDTO(String name, String state, String country, Double latitude, Double longitude, String timezone) {
        this.name = name;
        this.state = state;
        this.country = country;
        this.latitude = latitude;
        this.longitude = longitude;
        this.timezone = timezone;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }
}
