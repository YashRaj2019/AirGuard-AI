package com.airguard.repository;

import com.airguard.entity.City;
import com.airguard.entity.PredictionRecord;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PredictionRecordRepository extends JpaRepository<PredictionRecord, Long> {
    List<PredictionRecord> findByCityOrderByPredictionTimeDesc(City city, Pageable pageable);
    List<PredictionRecord> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
