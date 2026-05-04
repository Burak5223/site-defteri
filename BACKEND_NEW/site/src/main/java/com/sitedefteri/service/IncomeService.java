package com.sitedefteri.service;

import com.sitedefteri.entity.Income;
import com.sitedefteri.exception.ResourceNotFoundException;
import com.sitedefteri.repository.IncomeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class IncomeService {
    
    private final IncomeRepository incomeRepository;
    
    public List<Income> getAllIncomesBySite(String siteId) {
        log.info("Getting all incomes for site: {}", siteId);
        return incomeRepository.findBySiteIdOrderByIncomeDateDesc(siteId);
    }
    
    public Income getIncomeById(String id) {
        log.info("Getting income: {}", id);
        return incomeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Gelir bulunamadı: id = " + id));
    }
    
    public List<Income> getIncomesByCategory(String siteId, String category) {
        log.info("Getting incomes for site: {}, category: {}", siteId, category);
        return incomeRepository.findBySiteIdAndCategoryOrderByIncomeDateDesc(siteId, category);
    }
    
    @Transactional
    public Income createIncome(Income income) {
        log.info("Creating income for site: {}, category: {}", income.getSiteId(), income.getCategory());
        return incomeRepository.save(income);
    }
    
    @Transactional
    public Income updateIncome(String id, Income incomeUpdate) {
        log.info("Updating income: {}", id);
        
        Income existing = getIncomeById(id);
        
        if (incomeUpdate.getCategory() != null) {
            existing.setCategory(incomeUpdate.getCategory());
        }
        if (incomeUpdate.getDescription() != null) {
            existing.setDescription(incomeUpdate.getDescription());
        }
        if (incomeUpdate.getAmount() != null) {
            existing.setAmount(incomeUpdate.getAmount());
        }
        if (incomeUpdate.getCurrencyCode() != null) {
            existing.setCurrencyCode(incomeUpdate.getCurrencyCode());
        }
        if (incomeUpdate.getIncomeDate() != null) {
            existing.setIncomeDate(incomeUpdate.getIncomeDate());
        }
        if (incomeUpdate.getPayerName() != null) {
            existing.setPayerName(incomeUpdate.getPayerName());
        }
        if (incomeUpdate.getPaymentMethod() != null) {
            existing.setPaymentMethod(incomeUpdate.getPaymentMethod());
        }
        if (incomeUpdate.getReceiptNumber() != null) {
            existing.setReceiptNumber(incomeUpdate.getReceiptNumber());
        }
        if (incomeUpdate.getReceiptUrl() != null) {
            existing.setReceiptUrl(incomeUpdate.getReceiptUrl());
        }
        if (incomeUpdate.getNotes() != null) {
            existing.setNotes(incomeUpdate.getNotes());
        }
        
        return incomeRepository.save(existing);
    }
    
    @Transactional
    public void deleteIncome(String id) {
        log.info("Deleting income: {}", id);
        Income income = getIncomeById(id);
        incomeRepository.delete(income);
    }
}
