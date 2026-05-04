package com.sitedefteri.repository;

import com.sitedefteri.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, String> {
    List<Expense> findBySiteIdOrderByExpenseDateDesc(String siteId);
    List<Expense> findByFinancialPeriodId(String financialPeriodId);
    List<Expense> findBySiteIdAndCategory(String siteId, String category);
    List<Expense> findBySiteIdAndExpenseDateBetween(String siteId, LocalDate from, LocalDate to);
}
