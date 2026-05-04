package com.sitedefteri.service;

import com.sitedefteri.dto.request.CreateFinancialPeriodRequest;
import com.sitedefteri.dto.response.FinancialPeriodResponse;
import com.sitedefteri.dto.response.LedgerEntryResponse;
import com.sitedefteri.entity.FinancialPeriod;
import com.sitedefteri.exception.ResourceNotFoundException;
import com.sitedefteri.repository.DueRepository;
import com.sitedefteri.repository.ExpenseRepository;
import com.sitedefteri.repository.FinancialPeriodRepository;
import com.sitedefteri.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FinancialPeriodService {
    
    private final FinancialPeriodRepository financialPeriodRepository;
    private final PaymentRepository paymentRepository;
    private final ExpenseRepository expenseRepository;
    private final DueRepository dueRepository;
    
    public List<FinancialPeriodResponse> getPeriodsBySite(String siteId) {
        log.info("Fetching financial periods for site: {}", siteId);
        return financialPeriodRepository.findBySiteIdOrderByStartDateDesc(siteId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    public FinancialPeriodResponse getPeriodById(String periodId) {
        log.info("Fetching financial period: {}", periodId);
        FinancialPeriod period = financialPeriodRepository.findById(periodId)
                .orElseThrow(() -> new ResourceNotFoundException("Mali dönem", "id", periodId));
        return toResponse(period);
    }
    
    @Transactional
    public FinancialPeriodResponse createPeriod(String siteId, CreateFinancialPeriodRequest request) {
        log.info("Creating financial period for site: {}", siteId);
        
        FinancialPeriod period = new FinancialPeriod();
        period.setId(UUID.randomUUID().toString());
        period.setSiteId(siteId);
        period.setYear(request.getStartDate().getYear());
        period.setMonth(request.getStartDate().getMonthValue());
        period.setStartDate(request.getStartDate());
        period.setEndDate(request.getEndDate());
        period.setStatus("active");
        
        FinancialPeriod saved = financialPeriodRepository.save(period);
        log.info("Financial period created: {}", saved.getId());
        
        return toResponse(saved);
    }
    
    @Transactional
    public FinancialPeriodResponse closePeriod(String periodId) {
        log.info("Closing financial period: {}", periodId);
        
        FinancialPeriod period = financialPeriodRepository.findById(periodId)
                .orElseThrow(() -> new ResourceNotFoundException("Mali dönem", "id", periodId));
        
        period.setStatus("closed");
        period.setClosedAt(java.time.LocalDateTime.now());
        FinancialPeriod updated = financialPeriodRepository.save(period);
        
        log.info("Financial period closed: {}", periodId);
        return toResponse(updated);
    }
    
    @Transactional(readOnly = true)
    public List<LedgerEntryResponse> getLedger(String siteId, LocalDate from, LocalDate to) {
        log.info("Fetching ledger for site: {} from {} to {}", siteId, from, to);
        
        List<LedgerEntryResponse> entries = new ArrayList<>();
        BigDecimal runningBalance = BigDecimal.ZERO;
        
        // Get all payments (income)
        paymentRepository.findAll().forEach(payment -> {
            LedgerEntryResponse entry = new LedgerEntryResponse();
            entry.setId(payment.getId());
            entry.setDate(payment.getCreatedAt());
            entry.setType("INCOME");
            entry.setCategory("PAYMENT");
            entry.setDescription("Ödeme - " + payment.getPaymentMethod());
            entry.setAmount(payment.getAmount());
            entry.setCurrencyCode(payment.getCurrencyCode());
            entry.setReferenceId(payment.getId());
            entry.setReferenceType("PAYMENT");
            entries.add(entry);
        });
        
        // Get all expenses
        expenseRepository.findAll().forEach(expense -> {
            LedgerEntryResponse entry = new LedgerEntryResponse();
            entry.setId(expense.getId());
            entry.setDate(expense.getCreatedAt());
            entry.setType("EXPENSE");
            entry.setCategory(expense.getCategory());
            entry.setDescription(expense.getDescription());
            entry.setAmount(expense.getAmount());
            entry.setCurrencyCode(expense.getCurrencyCode());
            entry.setReferenceId(expense.getId());
            entry.setReferenceType("EXPENSE");
            entries.add(entry);
        });
        
        // Sort by date
        entries.sort(Comparator.comparing(LedgerEntryResponse::getDate));
        
        // Calculate running balance
        for (LedgerEntryResponse entry : entries) {
            if ("INCOME".equals(entry.getType())) {
                runningBalance = runningBalance.add(entry.getAmount());
            } else {
                runningBalance = runningBalance.subtract(entry.getAmount());
            }
            entry.setBalance(runningBalance);
        }
        
        return entries;
    }
    
    private FinancialPeriodResponse toResponse(FinancialPeriod period) {
        FinancialPeriodResponse response = new FinancialPeriodResponse();
        response.setId(period.getId());
        response.setSiteId(period.getSiteId());
        response.setPeriodName(period.getYear() + "-" + String.format("%02d", period.getMonth()));
        response.setStartDate(period.getStartDate());
        response.setEndDate(period.getEndDate());
        response.setStatus(period.getStatus());
        response.setDescription("Mali Dönem: " + period.getYear() + "/" + period.getMonth());
        response.setCreatedAt(period.getCreatedAt());
        return response;
    }
}
