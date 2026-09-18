package com.airguard.controller;

import com.airguard.dto.ApiResponse;
import com.airguard.dto.CityDTO;
import com.airguard.entity.City;
import com.airguard.entity.FavoriteCity;
import com.airguard.repository.CityRepository;
import com.airguard.repository.FavoriteCityRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    private final FavoriteCityRepository favoriteRepo;
    private final CityRepository cityRepo;

    public FavoriteController(FavoriteCityRepository favoriteRepo, CityRepository cityRepo) {
        this.favoriteRepo = favoriteRepo;
        this.cityRepo = cityRepo;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<CityDTO>>> getFavorites(
            @RequestParam(defaultValue = "default_user") String userId) {
        List<FavoriteCity> favs = favoriteRepo.findByUserIdentifierOrderByCreatedAtDesc(userId);
        List<CityDTO> dtos = favs.stream().map(f -> {
            City c = f.getCity();
            return new CityDTO(c.getId(), c.getName(), c.getState(), c.getCountry(), c.getLatitude(), c.getLongitude(), c.getTimezone());
        }).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<ApiResponse<String>> addFavorite(@RequestBody Map<String, Object> body) {
        String cityName = (String) body.get("cityName");
        String userId = (String) body.getOrDefault("userId", "default_user");

        if (cityName == null || cityName.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("City name is required"));
        }

        City city = cityRepo.findByNameIgnoreCase(cityName.trim())
                .orElse(null);

        if (city == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("City not found"));
        }

        if (!favoriteRepo.existsByUserIdentifierAndCity(userId, city)) {
            favoriteRepo.save(new FavoriteCity(city, userId));
        }

        return ResponseEntity.ok(ApiResponse.success("City added to favorites", cityName));
    }

    @DeleteMapping("/{cityName}")
    @Transactional
    public ResponseEntity<ApiResponse<String>> removeFavorite(
            @PathVariable String cityName,
            @RequestParam(defaultValue = "default_user") String userId) {
        cityRepo.findByNameIgnoreCase(cityName).ifPresent(city -> {
            favoriteRepo.deleteByUserIdentifierAndCity(userId, city);
        });
        return ResponseEntity.ok(ApiResponse.success("City removed from favorites", cityName));
    }
}
