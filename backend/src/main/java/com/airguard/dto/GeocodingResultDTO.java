package com.airguard.dto;

public class GeocodingResultDTO {

    private String name;
    private String state;
    private String country;
    private String countryCode;
    private Double latitude;
    private Double longitude;
    private String timezone;
    private Long population;

    public GeocodingResultDTO() {}

    public GeocodingResultDTO(String name, String state, String country, String countryCode, Double latitude, Double longitude, String timezone, Long population) {
        this.name = name;
        this.state = state;
        this.country = country;
        this.countryCode = countryCode;
        this.latitude = latitude;
        this.longitude = longitude;
        this.timezone = timezone;
        this.population = population;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }

    public Long getPopulation() { return population; }
    public void setPopulation(Long population) { this.population = population; }
}
