package com.sitedefteri.repository;

import com.sitedefteri.entity.Income;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncomeRepository extends JpaRepository<Income, String> {
    
    List<Income> findBySiteIdOrderByIncomeDateDesc(String siteId);
    
    List<Income> findBySiteIdAndCategoryOrderByIncomeDateDesc(String siteId, String category);
    
    List<Income> findByFinancialPeriodIdOrderByIncomeDateDesc(String financialPeriodId);
}
