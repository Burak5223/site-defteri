package com.sitedefteri.controller;

import com.sitedefteri.dto.request.CreateIncomeRequest;
import com.sitedefteri.dto.response.IncomeResponse;
import com.sitedefteri.entity.Income;
import com.sitedefteri.service.IncomeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class IncomeController {
    
    private final IncomeService incomeService;
    
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'RESIDENT')")
    @GetMapping("/sites/{siteId}/incomes")
    public ResponseEntity<List<IncomeResponse>> getAllIncomes(@PathVariable String siteId) {
        log.info("Getting incomes for site: {}", siteId);
        List<Income> incomes = incomeService.getAllIncomesBySite(siteId);
        List<IncomeResponse> responses = incomes.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }
    
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @GetMapping("/incomes")
    public ResponseEntity<List<IncomeResponse>> getAllIncomesSimple() {
        log.info("Getting all incomes");
        List<Income> incomes = incomeService.getAllIncomesBySite("1");
        List<IncomeResponse> responses = incomes.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }
    
    @PostMapping("/sites/{siteId}/incomes")
    public ResponseEntity<IncomeResponse> createIncomeForSite(
            @PathVariable String siteId,
            @Valid @RequestBody CreateIncomeRequest request) {
        log.info("Creating income for site: {}, category: {}", siteId, request.getCategory());
        
        Income income = new Income();
        income.setSiteId(siteId);
        income.setCategory(request.getCategory());
        income.setDescription(request.getDescription());
        income.setAmount(request.getAmount());
        income.setCurrencyCode(request.getCurrencyCode() != null ? request.getCurrencyCode() : "TRY");
        income.setIncomeDate(request.getIncomeDate());
        income.setPayerName(request.getPayerName());
        income.setPaymentMethod(request.getPaymentMethod());
        income.setReceiptNumber(request.getReceiptNumber());
        income.setReceiptUrl(request.getReceiptUrl());
        income.setNotes(request.getNotes());
        
        Income created = incomeService.createIncome(income);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(created));
    }
    
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @GetMapping("/incomes/site/{siteId}")
    public ResponseEntity<List<IncomeResponse>> getIncomesBySite(@PathVariable String siteId) {
        log.info("Getting incomes for site: {}", siteId);
        List<Income> incomes = incomeService.getAllIncomesBySite(siteId);
        List<IncomeResponse> responses = incomes.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }
    
    @GetMapping("/incomes/{id}")
    public ResponseEntity<IncomeResponse> getIncomeById(@PathVariable String id) {
        log.info("Getting income: {}", id);
        Income income = incomeService.getIncomeById(id);
        return ResponseEntity.ok(toResponse(income));
    }
    
    @PostMapping("/incomes")
    public ResponseEntity<IncomeResponse> createIncome(@Valid @RequestBody CreateIncomeRequest request) {
        log.info("Creating income for site: {}, category: {}", request.getSiteId(), request.getCategory());
        
        Income income = new Income();
        income.setSiteId(request.getSiteId());
        income.setCategory(request.getCategory());
        income.setDescription(request.getDescription());
        income.setAmount(request.getAmount());
        income.setCurrencyCode(request.getCurrencyCode());
        income.setIncomeDate(request.getIncomeDate());
        income.setPayerName(request.getPayerName());
        income.setPaymentMethod(request.getPaymentMethod());
        income.setReceiptNumber(request.getReceiptNumber());
        income.setReceiptUrl(request.getReceiptUrl());
        income.setNotes(request.getNotes());
        
        Income created = incomeService.createIncome(income);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(created));
    }
    
    @PutMapping("/incomes/{id}")
    public ResponseEntity<IncomeResponse> updateIncome(
            @PathVariable String id,
            @Valid @RequestBody CreateIncomeRequest request) {
        log.info("Updating income: {}", id);
        
        Income income = new Income();
        income.setCategory(request.getCategory());
        income.setDescription(request.getDescription());
        income.setAmount(request.getAmount());
        income.setCurrencyCode(request.getCurrencyCode());
        income.setIncomeDate(request.getIncomeDate());
        income.setPayerName(request.getPayerName());
        income.setPaymentMethod(request.getPaymentMethod());
        income.setReceiptNumber(request.getReceiptNumber());
        income.setReceiptUrl(request.getReceiptUrl());
        income.setNotes(request.getNotes());
        
        Income updated = incomeService.updateIncome(id, income);
        return ResponseEntity.ok(toResponse(updated));
    }
    
    @DeleteMapping("/incomes/{id}")
    public ResponseEntity<Void> deleteIncome(@PathVariable String id) {
        log.info("Deleting income: {}", id);
        incomeService.deleteIncome(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/incomes/site/{siteId}/category/{category}")
    public ResponseEntity<List<IncomeResponse>> getIncomesByCategory(
            @PathVariable String siteId,
            @PathVariable String category) {
        log.info("Getting incomes for site: {}, category: {}", siteId, category);
        List<Income> incomes = incomeService.getIncomesByCategory(siteId, category);
        List<IncomeResponse> responses = incomes.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }
    
    private IncomeResponse toResponse(Income income) {
        IncomeResponse response = new IncomeResponse();
        response.setId(income.getId());
        response.setSiteId(income.getSiteId());
        response.setFinancialPeriodId(income.getFinancialPeriodId());
        response.setCategory(income.getCategory());
        response.setDescription(income.getDescription());
        response.setAmount(income.getAmount());
        response.setCurrencyCode(income.getCurrencyCode());
        response.setIncomeDate(income.getIncomeDate());
        response.setPayerName(income.getPayerName());
        response.setPaymentMethod(income.getPaymentMethod());
        response.setReceiptNumber(income.getReceiptNumber());
        response.setReceiptUrl(income.getReceiptUrl());
        response.setNotes(income.getNotes());
        response.setCreatedAt(income.getCreatedAt());
        response.setUpdatedAt(income.getUpdatedAt());
        return response;
    }
}
