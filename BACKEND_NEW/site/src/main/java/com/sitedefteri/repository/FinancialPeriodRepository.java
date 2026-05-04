package com.sitedefteri.repository;

import com.sitedefteri.entity.FinancialPeriod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FinancialPeriodRepository extends JpaRepository<FinancialPeriod, String> {
    List<FinancialPeriod> findBySiteIdOrderByStartDateDesc(String siteId);
    List<FinancialPeriod> findBySiteIdAndStatus(String siteId, String status);
}
