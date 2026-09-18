package com.airguard.service;

import com.airguard.dto.*;
import com.airguard.entity.AirQualityRecord;
import com.airguard.entity.City;
import com.airguard.repository.AirQualityRecordRepository;
import com.airguard.repository.CityRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AirQualityService {

    private static final Logger log = LoggerFactory.getLogger(AirQualityService.class);

    private final CityRepository cityRepository;
    private final AirQualityRecordRepository recordRepository;
    private final AQICalculator aqiCalculator;
    private final WebClient externalApiWebClient;

    public AirQualityService(CityRepository cityRepository,
                             AirQualityRecordRepository recordRepository,
                             AQICalculator aqiCalculator,
                             WebClient externalApiWebClient) {
        this.cityRepository = cityRepository;
        this.recordRepository = recordRepository;
        this.aqiCalculator = aqiCalculator;
        this.externalApiWebClient = externalApiWebClient;
    }

    @Transactional(readOnly = true)
    public CurrentAirQualityDTO getCurrentAirQuality(String cityName) {
        City city = cityRepository.findByNameIgnoreCase(cityName)
                .orElseGet(() -> cityRepository.findAll().stream().findFirst()
                        .orElseThrow(() -> new NoSuchElementException("No cities available in database")));

        AirQualityRecord latest = recordRepository.findFirstByCityOrderByTimestampDesc(city)
                .orElse(null);

        if (latest == null) {
            log.warn("No records found for city: {}. Returning baseline synthetic response.", city.getName());
            return buildFallbackCurrent(city);
        }

        // Determine 24h trend direction
        OffsetDateTime oneDayAgo = latest.getTimestamp().minusHours(24);
        Double pastAvgAqi = recordRepository.findAverageAqiSince(city, oneDayAgo);
        String trend = "stable";
        if (pastAvgAqi != null && pastAvgAqi > 0) {
            double diff = latest.getAqi() - pastAvgAqi;
            if (diff > 12.0) trend = "increasing";
            else if (diff < -12.0) trend = "decreasing";
        }

        CurrentAirQualityDTO dto = new CurrentAirQualityDTO();
        dto.setCityName(city.getName());
        dto.setState(city.getState());
        dto.setCountry(city.getCountry());
        dto.setLatitude(city.getLatitude());
        dto.setLongitude(city.getLongitude());
        dto.setTimestamp(latest.getTimestamp());

        dto.setAqi(latest.getAqi());
        dto.setAqiCategory(latest.getAqiCategory());
        dto.setCategoryColor(aqiCalculator.getColor(latest.getAqi()));
        dto.setCategoryDescription(aqiCalculator.getDescription(latest.getAqi()));
        dto.setPrimaryPollutant(latest.getPrimaryPollutant() != null ? latest.getPrimaryPollutant() : "PM2.5");
        dto.setTrend(trend);

        dto.setPm25(latest.getPm25());
        dto.setPm10(latest.getPm10());
        dto.setNo2(latest.getNo2());
        dto.setSo2(latest.getSo2());
        dto.setCo(latest.getCo());
        dto.setO3(latest.getO3());

        dto.setTemperature(latest.getTemperature());
        dto.setHumidity(latest.getHumidity());
        dto.setWindSpeed(latest.getWindSpeed());

        // Baseline predicted AQI preview (approx next 24h)
        double predicted = Math.max(15.0, Math.min(500.0, (latest.getPm25() * 1.52) + (latest.getPm10() * 0.3) - (latest.getWindSpeed() * 1.2)));
        predicted = Math.round(predicted * 10.0) / 10.0;
        dto.setPredictedAqi(predicted);
        dto.setPredictedCategory(aqiCalculator.getCategory(predicted));
        dto.setDataSource(latest.getDataSource());

        return dto;
    }

    @Transactional(readOnly = true)
    public List<HistoricalRecordDTO> getHistoricalRecords(String cityName, int hours) {
        City city = cityRepository.findByNameIgnoreCase(cityName)
                .orElseThrow(() -> new NoSuchElementException("City not found: " + cityName));

        int limit = Math.min(hours > 0 ? hours : 72, 720); // max 30 days
        List<AirQualityRecord> records = recordRepository.findByCityOrderByTimestampDesc(city, PageRequest.of(0, limit));
        
        // Reverse to chronological order (oldest to newest) for charting
        Collections.reverse(records);

        return records.stream().map(r -> {
            HistoricalRecordDTO dto = new HistoricalRecordDTO();
            dto.setTimestamp(r.getTimestamp());
            dto.setAqi(r.getAqi());
            dto.setAqiCategory(r.getAqiCategory());
            dto.setPm25(r.getPm25());
            dto.setPm10(r.getPm10());
            dto.setNo2(r.getNo2());
            dto.setSo2(r.getSo2());
            dto.setCo(r.getCo());
            dto.setO3(r.getO3());
            dto.setTemperature(r.getTemperature());
            dto.setHumidity(r.getHumidity());
            dto.setWindSpeed(r.getWindSpeed());
            return dto;
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TrendsDTO getTrends(String cityName) {
        City city = cityRepository.findByNameIgnoreCase(cityName)
                .orElseThrow(() -> new NoSuchElementException("City not found: " + cityName));

        OffsetDateTime now = OffsetDateTime.now();
        List<AirQualityRecord> past30Days = recordRepository.findByCityOrderByTimestampDesc(city, PageRequest.of(0, 720));

        TrendsDTO dto = new TrendsDTO();
        dto.setCityName(city.getName());

        if (past30Days.isEmpty()) {
            dto.setCurrentAqi(120.0);
            dto.setTrendDirection("stable");
            dto.setPercentageChange24h(0.0);
            return dto;
        }

        AirQualityRecord latest = past30Days.get(0);
        dto.setCurrentAqi(Double.valueOf(latest.getAqi()));

        // Group by day for daily averages
        Map<String, List<AirQualityRecord>> byDay = past30Days.stream()
                .collect(Collectors.groupingBy(r -> r.getTimestamp().format(DateTimeFormatter.ISO_LOCAL_DATE),
                        LinkedHashMap::new, Collectors.toList()));

        List<TrendsDTO.DailySummary> dailySummaries = new ArrayList<>();
        double totalAqi = 0.0;
        int count = 0;

        for (Map.Entry<String, List<AirQualityRecord>> entry : byDay.entrySet()) {
            List<AirQualityRecord> dayList = entry.getValue();
            double dayAvgAqi = dayList.stream().mapToInt(AirQualityRecord::getAqi).average().orElse(0.0);
            double dayAvgPm25 = dayList.stream().filter(r -> r.getPm25() != null).mapToDouble(AirQualityRecord::getPm25).average().orElse(0.0);
            double dayAvgPm10 = dayList.stream().filter(r -> r.getPm10() != null).mapToDouble(AirQualityRecord::getPm10).average().orElse(0.0);

            dayAvgAqi = Math.round(dayAvgAqi * 10.0) / 10.0;
            dailySummaries.add(new TrendsDTO.DailySummary(
                    entry.getKey(),
                    dayAvgAqi,
                    aqiCalculator.getCategory(dayAvgAqi),
                    Math.round(dayAvgPm25 * 10.0) / 10.0,
                    Math.round(dayAvgPm10 * 10.0) / 10.0
            ));
            totalAqi += dayAvgAqi;
            count++;
        }

        // Limit to past 14 days for clean chart
        Collections.reverse(dailySummaries);
        if (dailySummaries.size() > 14) {
            dailySummaries = dailySummaries.subList(dailySummaries.size() - 14, dailySummaries.size());
        }
        dto.setDailyAverages(dailySummaries);

        double avg24h = past30Days.stream().limit(24).mapToInt(AirQualityRecord::getAqi).average().orElse(latest.getAqi());
        double avg7d = past30Days.stream().limit(168).mapToInt(AirQualityRecord::getAqi).average().orElse(avg24h);
        double avg30d = count > 0 ? (totalAqi / count) : avg7d;

        dto.setAverage24hAqi(Math.round(avg24h * 10.0) / 10.0);
        dto.setAverage7dAqi(Math.round(avg7d * 10.0) / 10.0);
        dto.setAverage30dAqi(Math.round(avg30d * 10.0) / 10.0);

        // Trend calculation
        double pct = ((latest.getAqi() - avg24h) / Math.max(1.0, avg24h)) * 100.0;
        dto.setPercentageChange24h(Math.round(pct * 10.0) / 10.0);

        if (pct > 8.0) dto.setTrendDirection("increasing");
        else if (pct < -8.0) dto.setTrendDirection("decreasing");
        else dto.setTrendDirection("stable");

        // Average pollutant concentrations
        Map<String, Double> pollAvgs = new HashMap<>();
        pollAvgs.put("PM2.5", Math.round(past30Days.stream().filter(r -> r.getPm25() != null).mapToDouble(AirQualityRecord::getPm25).average().orElse(0.0) * 10.0) / 10.0);
        pollAvgs.put("PM10", Math.round(past30Days.stream().filter(r -> r.getPm10() != null).mapToDouble(AirQualityRecord::getPm10).average().orElse(0.0) * 10.0) / 10.0);
        pollAvgs.put("NO2", Math.round(past30Days.stream().filter(r -> r.getNo2() != null).mapToDouble(AirQualityRecord::getNo2).average().orElse(0.0) * 10.0) / 10.0);
        pollAvgs.put("SO2", Math.round(past30Days.stream().filter(r -> r.getSo2() != null).mapToDouble(AirQualityRecord::getSo2).average().orElse(0.0) * 10.0) / 10.0);
        pollAvgs.put("CO", Math.round(past30Days.stream().filter(r -> r.getCo() != null).mapToDouble(AirQualityRecord::getCo).average().orElse(0.0) * 100.0) / 100.0);
        pollAvgs.put("O3", Math.round(past30Days.stream().filter(r -> r.getO3() != null).mapToDouble(AirQualityRecord::getO3).average().orElse(0.0) * 10.0) / 10.0);
        dto.setPollutantAverages(pollAvgs);

        return dto;
    }

    @Transactional(readOnly = true)
    public List<PollutantDetailDTO> getPollutantDetails(String cityName) {
        CurrentAirQualityDTO curr = getCurrentAirQuality(cityName);
        List<PollutantDetailDTO> list = new ArrayList<>();

        // PM2.5
        PollutantDetailDTO pm25 = new PollutantDetailDTO();
        pm25.setName("Fine Particulate Matter");
        pm25.setCode("PM2.5");
        pm25.setCurrentValue(curr.getPm25());
        pm25.setUnit("ug/m3");
        pm25.setSafeReferenceRange("0 - 12.0 ug/m3 (WHO/EPA 24h benchmark)");
        pm25.setSubIndex(aqiCalculator.getPm25SubIndex(curr.getPm25()));
        pm25.setRelativeContribution(48.0);
        pm25.setStatus(curr.getPm25() <= 35.4 ? "Acceptable" : curr.getPm25() <= 55.4 ? "Elevated" : "Hazardous");
        pm25.setStatusColor(curr.getPm25() <= 35.4 ? "#10B981" : curr.getPm25() <= 55.4 ? "#F97316" : "#EF4444");
        pm25.setDescription("Microscopic airborne solid or liquid droplets <= 2.5 micrometers, capable of penetrating deep into lungs and bloodstream.");
        pm25.setHealthEffects("Short-term: eye, nose, throat irritation; coughing. Long-term: aggravated asthma, reduced lung capacity, cardiovascular stress.");
        list.add(pm25);

        // PM10
        PollutantDetailDTO pm10 = new PollutantDetailDTO();
        pm10.setName("Coarse Particulate Matter");
        pm10.setCode("PM10");
        pm10.setCurrentValue(curr.getPm10());
        pm10.setUnit("ug/m3");
        pm10.setSafeReferenceRange("0 - 54.0 ug/m3");
        pm10.setSubIndex(aqiCalculator.getPm10SubIndex(curr.getPm10()));
        pm10.setRelativeContribution(24.0);
        pm10.setStatus(curr.getPm10() <= 154 ? "Acceptable" : "Elevated");
        pm10.setStatusColor(curr.getPm10() <= 154 ? "#10B981" : "#EF4444");
        pm10.setDescription("Inhalable particles <= 10 micrometers derived from dust, construction, unpaved roads, and combustion.");
        pm10.setHealthEffects("Irritation of upper airways, exacerbation of allergic rhinitis, bronchoconstriction.");
        list.add(pm10);

        // NO2
        PollutantDetailDTO no2 = new PollutantDetailDTO();
        no2.setName("Nitrogen Dioxide");
        no2.setCode("NO2");
        no2.setCurrentValue(curr.getNo2());
        no2.setUnit("ug/m3");
        no2.setSafeReferenceRange("0 - 53.0 ug/m3");
        no2.setSubIndex(aqiCalculator.getNo2SubIndex(curr.getNo2()));
        no2.setRelativeContribution(12.0);
        no2.setStatus(curr.getNo2() <= 100 ? "Safe" : "Elevated");
        no2.setStatusColor(curr.getNo2() <= 100 ? "#10B981" : "#F97316");
        no2.setDescription("Reddish-brown gas produced by internal combustion vehicular engines and industrial power plants.");
        no2.setHealthEffects("Inflammation of respiratory pathways, increased risk of bronchial hyperresponsiveness.");
        list.add(no2);

        // O3
        PollutantDetailDTO o3 = new PollutantDetailDTO();
        o3.setName("Ground-Level Ozone");
        o3.setCode("O3");
        o3.setCurrentValue(curr.getO3());
        o3.setUnit("ug/m3");
        o3.setSafeReferenceRange("0 - 105.0 ug/m3");
        o3.setSubIndex(aqiCalculator.getO3SubIndex(curr.getO3()));
        o3.setRelativeContribution(8.0);
        o3.setStatus(curr.getO3() <= 140 ? "Safe" : "Elevated");
        o3.setStatusColor(curr.getO3() <= 140 ? "#10B981" : "#EF4444");
        o3.setDescription("Secondary photochemical pollutant formed when NOx and volatile organic compounds react under sunlight.");
        o3.setHealthEffects("Chest tightness, throat irritation, reduced pulmonary peak flow during outdoor exercise.");
        list.add(o3);

        // SO2
        PollutantDetailDTO so2 = new PollutantDetailDTO();
        so2.setName("Sulphur Dioxide");
        so2.setCode("SO2");
        so2.setCurrentValue(curr.getSo2());
        so2.setUnit("ug/m3");
        so2.setSafeReferenceRange("0 - 35.0 ug/m3");
        so2.setSubIndex(curr.getSo2() != null ? curr.getSo2() * 1.1 : 5.0);
        so2.setRelativeContribution(5.0);
        so2.setStatus("Safe");
        so2.setStatusColor("#10B981");
        so2.setDescription("Pungent gas emitted from fossil fuel burning, coal-fired power stations, and metal extraction.");
        so2.setHealthEffects("Irritation of mucous membranes; bronchospasms in sensitive asthmatic individuals.");
        list.add(so2);

        // CO
        PollutantDetailDTO co = new PollutantDetailDTO();
        co.setName("Carbon Monoxide");
        co.setCode("CO");
        co.setCurrentValue(curr.getCo());
        co.setUnit("mg/m3");
        co.setSafeReferenceRange("0 - 4.4 mg/m3");
        co.setSubIndex(curr.getCo() != null ? curr.getCo() * 8.0 : 4.0);
        co.setRelativeContribution(3.0);
        co.setStatus("Safe");
        co.setStatusColor("#10B981");
        co.setDescription("Colorless, odorless gas generated from incomplete combustion of carbon-based fuels.");
        co.setHealthEffects("Binds with hemoglobin to form carboxyhemoglobin, reducing systemic oxygen delivery.");
        list.add(co);

        return list;
    }

    @Transactional(readOnly = true)
    public CityCompareDTO compareCities(List<String> cityNames) {
        List<CurrentAirQualityDTO> cities = new ArrayList<>();
        for (String name : cityNames) {
            try {
                cities.add(getCurrentAirQuality(name));
            } catch (Exception e) {
                log.warn("Could not load city for comparison: {}", name);
            }
        }

        if (cities.isEmpty()) {
            return new CityCompareDTO(Collections.emptyList(), "None", 0.0, "No cities found for comparison.");
        }

        cities.sort(Comparator.comparingInt(CurrentAirQualityDTO::getAqi));
        CurrentAirQualityDTO cleanest = cities.get(0);
        CurrentAirQualityDTO mostPolluted = cities.get(cities.size() - 1);
        double diff = mostPolluted.getAqi() - cleanest.getAqi();

        String analysis = String.format("%s currently enjoys significantly better air quality with an AQI of %d (%s) compared to %s at %d (%s). The primary factor separating them is fine particulate matter (PM2.5: %.1f ug/m3 vs %.1f ug/m3), influenced by local wind dispersion and emissions density.",
                cleanest.getCityName(), cleanest.getAqi(), cleanest.getAqiCategory(),
                mostPolluted.getCityName(), mostPolluted.getAqi(), mostPolluted.getAqiCategory(),
                cleanest.getPm25(), mostPolluted.getPm25());

        return new CityCompareDTO(cities, cleanest.getCityName(), Math.round(diff * 10.0) / 10.0, analysis);
    }

    private CurrentAirQualityDTO buildFallbackCurrent(City city) {
        CurrentAirQualityDTO dto = new CurrentAirQualityDTO();
        dto.setCityName(city.getName());
        dto.setState(city.getState());
        dto.setCountry(city.getCountry());
        dto.setLatitude(city.getLatitude());
        dto.setLongitude(city.getLongitude());
        dto.setTimestamp(OffsetDateTime.now());
        dto.setAqi(95);
        dto.setAqiCategory("Moderate");
        dto.setCategoryColor(aqiCalculator.getColor(95));
        dto.setCategoryDescription(aqiCalculator.getDescription(95));
        dto.setPrimaryPollutant("PM2.5");
        dto.setTrend("stable");
        dto.setPm25(32.0);
        dto.setPm10(58.0);
        dto.setNo2(22.0);
        dto.setSo2(6.0);
        dto.setCo(0.8);
        dto.setO3(45.0);
        dto.setTemperature(26.0);
        dto.setHumidity(55.0);
        dto.setWindSpeed(8.5);
        dto.setPredictedAqi(105.0);
        dto.setPredictedCategory("Unhealthy for Sensitive Groups");
        dto.setDataSource("AirGuard Fallback Engine");
        return dto;
    }

    @Transactional
    public int syncLiveTelemetryForCity(City city, int pastDays) {
        log.info("Starting live atmospheric telemetry sync for city: {} ({}, {})", city.getName(), city.getLatitude(), city.getLongitude());
        try {
            int days = Math.max(2, Math.min(pastDays, 7));
            String airQualityUrl = String.format(Locale.US,
                    "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=%.4f&longitude=%.4f&hourly=pm2_5,pm10,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide,ozone,us_aqi&past_days=%d&forecast_days=1&timezone=UTC",
                    city.getLatitude(), city.getLongitude(), days);

            String weatherUrl = String.format(Locale.US,
                    "https://api.open-meteo.com/v1/forecast?latitude=%.4f&longitude=%.4f&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m&past_days=%d&forecast_days=1&timezone=UTC",
                    city.getLatitude(), city.getLongitude(), days);

            @SuppressWarnings("unchecked")
            Map<String, Object> aqResp = externalApiWebClient.get()
                    .uri(airQualityUrl)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block(Duration.ofSeconds(15));

            @SuppressWarnings("unchecked")
            Map<String, Object> weatherResp = externalApiWebClient.get()
                    .uri(weatherUrl)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block(Duration.ofSeconds(15));

            if (aqResp == null || !aqResp.containsKey("hourly")) {
                log.warn("Failed to fetch air quality telemetry from Open-Meteo for {}", city.getName());
                return 0;
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> aqHourly = (Map<String, Object>) aqResp.get("hourly");
            @SuppressWarnings("unchecked")
            Map<String, Object> weatherHourly = (weatherResp != null && weatherResp.containsKey("hourly"))
                    ? (Map<String, Object>) weatherResp.get("hourly") : Collections.emptyMap();

            @SuppressWarnings("unchecked")
            List<String> times = (List<String>) aqHourly.get("time");
            List<?> pm25List = (List<?>) aqHourly.get("pm2_5");
            List<?> pm10List = (List<?>) aqHourly.get("pm10");
            List<?> no2List = (List<?>) aqHourly.get("nitrogen_dioxide");
            List<?> so2List = (List<?>) aqHourly.get("sulphur_dioxide");
            List<?> coList = (List<?>) aqHourly.get("carbon_monoxide");
            List<?> o3List = (List<?>) aqHourly.get("ozone");
            List<?> usAqiList = (List<?>) aqHourly.get("us_aqi");

            List<?> tempList = (List<?>) weatherHourly.get("temperature_2m");
            List<?> rhList = (List<?>) weatherHourly.get("relative_humidity_2m");
            List<?> wsList = (List<?>) weatherHourly.get("wind_speed_10m");

            if (times == null || times.isEmpty()) return 0;

            List<AirQualityRecord> toSave = new ArrayList<>();

            for (int i = 0; i < times.size(); i++) {
                String timeStr = times.get(i);
                LocalDateTime ldt;
                try {
                    ldt = LocalDateTime.parse(timeStr);
                } catch (Exception ex) {
                    continue;
                }
                OffsetDateTime timestamp = ldt.atOffset(ZoneOffset.UTC);

                if (recordRepository.existsByCityAndTimestamp(city, timestamp)) {
                    continue;
                }

                Double pm25 = extractNumber(pm25List, i);
                Double pm10 = extractNumber(pm10List, i);
                Double no2 = extractNumber(no2List, i);
                Double so2 = extractNumber(so2List, i);
                Double co = extractNumber(coList, i);
                Double o3 = extractNumber(o3List, i);
                Double usAqiVal = extractNumber(usAqiList, i);

                Double temp = extractNumber(tempList, i);
                Double rh = extractNumber(rhList, i);
                Double ws = extractNumber(wsList, i);

                // Determine overall AQI
                int computedAqi = 50;
                if (usAqiVal != null && usAqiVal > 0) {
                    computedAqi = usAqiVal.intValue();
                } else if (pm25 != null) {
                    computedAqi = (int) Math.round(aqiCalculator.getPm25SubIndex(pm25));
                }

                // Determine primary pollutant
                String primaryPollutant = "PM2.5";
                double maxSub = (pm25 != null) ? aqiCalculator.getPm25SubIndex(pm25) : 0.0;
                if (pm10 != null && aqiCalculator.getPm10SubIndex(pm10) > maxSub) {
                    maxSub = aqiCalculator.getPm10SubIndex(pm10);
                    primaryPollutant = "PM10";
                }
                if (o3 != null && aqiCalculator.getO3SubIndex(o3) > maxSub) {
                    primaryPollutant = "O3";
                }

                AirQualityRecord record = new AirQualityRecord();
                record.setCity(city);
                record.setTimestamp(timestamp);
                record.setPm25(pm25 != null ? Math.round(pm25 * 10.0) / 10.0 : 25.0);
                record.setPm10(pm10 != null ? Math.round(pm10 * 10.0) / 10.0 : 45.0);
                record.setNo2(no2 != null ? Math.round(no2 * 10.0) / 10.0 : 15.0);
                record.setSo2(so2 != null ? Math.round(so2 * 10.0) / 10.0 : 5.0);
                // Convert CO from ug/m3 to mg/m3 if > 20
                if (co != null) {
                    double coMg = (co > 20.0) ? (co / 1000.0) : co;
                    record.setCo(Math.round(coMg * 100.0) / 100.0);
                } else {
                    record.setCo(0.6);
                }
                record.setO3(o3 != null ? Math.round(o3 * 10.0) / 10.0 : 35.0);

                record.setTemperature(temp != null ? Math.round(temp * 10.0) / 10.0 : 22.0);
                record.setHumidity(rh != null ? Math.round(rh * 10.0) / 10.0 : 60.0);
                record.setWindSpeed(ws != null ? Math.round(ws * 10.0) / 10.0 : 8.0);

                record.setAqi(computedAqi);
                record.setAqiCategory(aqiCalculator.getCategory(computedAqi));
                record.setPrimaryPollutant(primaryPollutant);
                record.setDataSource("Open-Meteo CAMS Live");

                toSave.add(record);
            }

            if (!toSave.isEmpty()) {
                recordRepository.saveAll(toSave);
                log.info("Successfully ingested {} atmospheric records for city: {}", toSave.size(), city.getName());
            }

            return toSave.size();
        } catch (Exception e) {
            log.error("Error while syncing live telemetry for city {}: {}", city.getName(), e.getMessage(), e);
            return 0;
        }
    }

    private Double extractNumber(List<?> list, int idx) {
        if (list == null || idx < 0 || idx >= list.size()) return null;
        Object obj = list.get(idx);
        if (obj == null) return null;
        if (obj instanceof Number) {
            return ((Number) obj).doubleValue();
        }
        try {
            return Double.parseDouble(obj.toString());
        } catch (Exception e) {
            return null;
        }
    }
}
