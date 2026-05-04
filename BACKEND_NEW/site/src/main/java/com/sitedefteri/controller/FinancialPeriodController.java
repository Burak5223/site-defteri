package com.sitedefteri.controller;

import com.sitedefteri.dto.request.CreateFinancialPeriodRequest;
import com.sitedefteri.dto.response.FinancialPeriodResponse;
import com.sitedefteri.dto.response.LedgerEntryResponse;
import com.sitedefteri.service.FinancialPeriodService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/sites/{siteId}/financial-periods")
@RequiredArgsConstructor
public class FinancialPeriodController {
    
    private final FinancialPeriodService financialPeriodService;
    
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<FinancialPeriodResponse>> getPeriods(@PathVariable String siteId) {
        return ResponseEntity.ok(financialPeriodService.getPeriodsBySite(siteId));
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{periodId}")
    public ResponseEntity<FinancialPeriodResponse> getPeriod(
            @PathVariable String siteId,
            @PathVariable String periodId) {
        return ResponseEntity.ok(financialPeriodService.getPeriodById(periodId));
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<FinancialPeriodResponse> createPeriod(
            @PathVariable String siteId,
            @Valid @RequestBody CreateFinancialPeriodRequest request) {
        return ResponseEntity.ok(financialPeriodService.createPeriod(siteId, request));
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{periodId}/close")
    public ResponseEntity<FinancialPeriodResponse> closePeriod(
            @PathVariable String siteId,
            @PathVariable String periodId) {
        return ResponseEntity.ok(financialPeriodService.closePeriod(periodId));
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'RESIDENT')")
    @GetMapping("/ledger")
    public ResponseEntity<List<LedgerEntryResponse>> getLedger(
            @PathVariable String siteId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(financialPeriodService.getLedger(siteId, from, to));
    }
}
