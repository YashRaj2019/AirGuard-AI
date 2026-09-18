package com.airguard.repository;

import com.airguard.entity.ModelMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ModelMetricRepository extends JpaRepository<ModelMetric, Long> {
    List<ModelMetric> findAllByOrderByR2Desc();
}
