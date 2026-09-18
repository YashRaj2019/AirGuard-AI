package com.airguard.repository;

import com.airguard.entity.AirQualityRecord;
import com.airguard.entity.City;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AirQualityRecordRepository extends JpaRepository<AirQualityRecord, Long> {

    Optional<AirQualityRecord> findFirstByCityOrderByTimestampDesc(City city);

    List<AirQualityRecord> findByCityAndTimestampBetweenOrderByTimestampAsc(
            City city, OffsetDateTime start, OffsetDateTime end);

    List<AirQualityRecord> findByCityOrderByTimestampDesc(City city, Pageable pageable);

    @Query("SELECT r FROM AirQualityRecord r WHERE r.city = :city AND r.timestamp >= :since ORDER BY r.timestamp ASC")
    List<AirQualityRecord> findRecentRecords(@Param("city") City city, @Param("since") OffsetDateTime since);

    @Query("SELECT AVG(r.aqi) FROM AirQualityRecord r WHERE r.city = :city AND r.timestamp >= :since")
    Double findAverageAqiSince(@Param("city") City city, @Param("since") OffsetDateTime since);

    boolean existsByCityAndTimestamp(City city, OffsetDateTime timestamp);

    long countByCity(City city);
}
