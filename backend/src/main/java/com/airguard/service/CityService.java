package com.airguard.service;

import com.airguard.dto.AddCityRequestDTO;
import com.airguard.dto.CityDTO;
import com.airguard.dto.GeocodingResultDTO;
import com.airguard.entity.City;
import com.airguard.exception.ResourceNotFoundException;
import com.airguard.repository.CityRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CityService {

    private static final Logger log = LoggerFactory.getLogger(CityService.class);

    private final CityRepository cityRepository;
    private final AirQualityService airQualityService;
    private final WebClient externalApiWebClient;

    public CityService(CityRepository cityRepository,
                       AirQualityService airQualityService,
                       WebClient externalApiWebClient) {
        this.cityRepository = cityRepository;
        this.airQualityService = airQualityService;
        this.externalApiWebClient = externalApiWebClient;
    }

    @Transactional(readOnly = true)
    public List<CityDTO> getAllCities() {
        return cityRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public City getCityEntityByName(String name) {
        return cityRepository.findByNameIgnoreCase(name)
                .orElseThrow(() -> new ResourceNotFoundException("City not found: " + name));
    }

    @Transactional(readOnly = true)
    public CityDTO getCityByName(String name) {
        return toDTO(getCityEntityByName(name));
    }

    public List<GeocodingResultDTO> searchCities(String query) {
        if (query == null || query.trim().length() < 2) {
            return Collections.emptyList();
        }

        try {
            String encoded = URLEncoder.encode(query.trim(), StandardCharsets.UTF_8);
            String url = String.format("https://geocoding-api.open-meteo.com/v1/search?name=%s&count=8&language=en&format=json", encoded);

            @SuppressWarnings("unchecked")
            Map<String, Object> resp = externalApiWebClient.get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block(Duration.ofSeconds(6));

            if (resp == null || !resp.containsKey("results")) {
                return Collections.emptyList();
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> results = (List<Map<String, Object>>) resp.get("results");
            List<GeocodingResultDTO> list = new ArrayList<>();

            for (Map<String, Object> item : results) {
                String name = (String) item.get("name");
                String state = (String) item.get("admin1");
                String country = (String) item.get("country");
                String countryCode = (String) item.get("country_code");
                Double lat = item.get("latitude") instanceof Number ? ((Number) item.get("latitude")).doubleValue() : null;
                Double lon = item.get("longitude") instanceof Number ? ((Number) item.get("longitude")).doubleValue() : null;
                String timezone = (String) item.get("timezone");
                Long pop = item.get("population") instanceof Number ? ((Number) item.get("population")).longValue() : null;

                if (name != null && lat != null && lon != null) {
                    list.add(new GeocodingResultDTO(name, state, country, countryCode, lat, lon, timezone, pop));
                }
            }
            return list;
        } catch (Exception e) {
            log.warn("City search failed for query {}: {}", query, e.getMessage());
            return Collections.emptyList();
        }
    }

    @Transactional
    public CityDTO locateAndRegister(Double lat, Double lon, String optionalName) {
        if (lat == null || lon == null) {
            throw new IllegalArgumentException("Latitude and Longitude are required");
        }

        String resolvedName = (optionalName != null && !optionalName.isBlank()) ? optionalName.trim() : null;
        String state = null;
        String country = "Global";
        String timezone = "UTC";

        if (resolvedName == null) {
            try {
                String url = String.format(Locale.US,
                        "https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=%.5f&longitude=%.5f&localityLanguage=en",
                        lat, lon);

                @SuppressWarnings("unchecked")
                Map<String, Object> resp = externalApiWebClient.get()
                        .uri(url)
                        .retrieve()
                        .bodyToMono(Map.class)
                        .block(Duration.ofSeconds(6));

                if (resp != null) {
                    Object cityObj = resp.get("city");
                    if (cityObj == null || cityObj.toString().isBlank()) cityObj = resp.get("locality");
                    if (cityObj == null || cityObj.toString().isBlank()) cityObj = resp.get("principalSubdivision");
                    if (cityObj != null && !cityObj.toString().isBlank()) {
                        resolvedName = cityObj.toString().trim();
                    }
                    if (resp.get("principalSubdivision") != null) {
                        state = resp.get("principalSubdivision").toString().trim();
                    }
                    if (resp.get("countryName") != null) {
                        country = resp.get("countryName").toString().trim();
                    }
                }
            } catch (Exception e) {
                log.warn("Reverse geocode failed for ({}, {}): {}", lat, lon, e.getMessage());
            }
        }

        if (resolvedName == null || resolvedName.isBlank()) {
            resolvedName = String.format(Locale.US, "Location (%.2f, %.2f)", lat, lon);
        }

        Optional<City> existing = cityRepository.findByNameIgnoreCase(resolvedName);
        City city;
        if (existing.isPresent()) {
            city = existing.get();
            log.info("Found existing city for coordinates: {}", city.getName());
        } else {
            city = new City(resolvedName, state, country, lat, lon, timezone);
            city = cityRepository.save(city);
            log.info("Created new city from GPS/Location: {} ({}, {})", city.getName(), lat, lon);
        }

        // Trigger live telemetry ingestion for this city
        try {
            airQualityService.syncLiveTelemetryForCity(city, 7);
        } catch (Exception e) {
            log.warn("Could not sync live telemetry for {}: {}", city.getName(), e.getMessage());
        }

        return toDTO(city);
    }

    @Transactional
    public CityDTO addCustomCity(AddCityRequestDTO req) {
        String name = req.getName().trim();
        Optional<City> existing = cityRepository.findByNameIgnoreCase(name);
        City city;
        if (existing.isPresent()) {
            city = existing.get();
        } else {
            city = new City(name, req.getState(), req.getCountry(), req.getLatitude(), req.getLongitude(),
                    req.getTimezone() != null ? req.getTimezone() : "UTC");
            city = cityRepository.save(city);
            log.info("Registered custom city: {}", city.getName());
        }

        try {
            airQualityService.syncLiveTelemetryForCity(city, 7);
        } catch (Exception e) {
            log.warn("Could not sync live telemetry for {}: {}", city.getName(), e.getMessage());
        }

        return toDTO(city);
    }

    private CityDTO toDTO(City c) {
        return new CityDTO(c.getId(), c.getName(), c.getState(), c.getCountry(), c.getLatitude(), c.getLongitude(), c.getTimezone());
    }
}
