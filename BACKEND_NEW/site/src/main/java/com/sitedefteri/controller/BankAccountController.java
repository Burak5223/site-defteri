package com.sitedefteri.controller;

import com.sitedefteri.dto.request.CreateBankAccountRequest;
import com.sitedefteri.dto.response.BankAccountResponse;
import com.sitedefteri.service.BankAccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class BankAccountController {
    
    private final BankAccountService bankAccountService;
    
    /**
     * Site banka hesaplarını getir
     * GET /api/sites/{siteId}/bank-accounts
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'RESIDENT', 'SECURITY', 'CLEANING')")
    @GetMapping("/sites/{siteId}/bank-accounts")
    public ResponseEntity<List<BankAccountResponse>> getBankAccounts(@PathVariable String siteId) {
        return ResponseEntity.ok(bankAccountService.getAllBankAccounts(siteId));
    }
    
    /**
     * Tüm banka hesaplarını getir (Super Admin için)
     * GET /api/bank-accounts
     */
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @GetMapping("/bank-accounts")
    public ResponseEntity<List<BankAccountResponse>> getAllBankAccounts() {
        // Super Admin için tüm sitelerin banka hesaplarını döndür
        return ResponseEntity.ok(bankAccountService.getAllBankAccounts("1"));
    }
    
    /**
     * Yeni banka hesabı oluştur
     * POST /api/sites/{siteId}/bank-accounts
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @PostMapping("/sites/{siteId}/bank-accounts")
    public ResponseEntity<BankAccountResponse> createBankAccount(
            @PathVariable String siteId,
            @Valid @RequestBody CreateBankAccountRequest request) {
        request.setSiteId(siteId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bankAccountService.createBankAccount(request));
    }
    
    /**
     * Banka hesabını güncelle
     * PUT /api/bank-accounts/{accountId}
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @PutMapping("/bank-accounts/{accountId}")
    public ResponseEntity<BankAccountResponse> updateBankAccount(
            @PathVariable String accountId,
            @Valid @RequestBody CreateBankAccountRequest request) {
        return ResponseEntity.ok(bankAccountService.updateBankAccount(accountId, request));
    }
    
    /**
     * Banka hesabını sil
     * DELETE /api/bank-accounts/{accountId}
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @DeleteMapping("/bank-accounts/{accountId}")
    public ResponseEntity<Void> deleteBankAccount(@PathVariable String accountId) {
        bankAccountService.deleteBankAccount(accountId);
        return ResponseEntity.noContent().build();
    }
}
