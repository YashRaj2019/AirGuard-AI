package com.airguard.repository;

import com.airguard.entity.City;
import com.airguard.entity.FavoriteCity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteCityRepository extends JpaRepository<FavoriteCity, Long> {
    List<FavoriteCity> findByUserIdentifierOrderByCreatedAtDesc(String userIdentifier);
    Optional<FavoriteCity> findByUserIdentifierAndCity(String userIdentifier, City city);
    boolean existsByUserIdentifierAndCity(String userIdentifier, City city);
    void deleteByUserIdentifierAndCity(String userIdentifier, City city);
}
