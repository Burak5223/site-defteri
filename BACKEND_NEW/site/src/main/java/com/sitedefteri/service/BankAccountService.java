package com.sitedefteri.service;

import com.sitedefteri.dto.request.CreateBankAccountRequest;
import com.sitedefteri.dto.response.BankAccountResponse;
import com.sitedefteri.entity.SiteBankAccount;
import com.sitedefteri.exception.ResourceNotFoundException;
import com.sitedefteri.repository.SiteBankAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BankAccountService {
    
    private final SiteBankAccountRepository bankAccountRepository;
    
    @Transactional(readOnly = true)
    public BankAccountResponse getSiteBankAccount(String siteId) {
        log.info("Fetching primary bank account for site: {}", siteId);
        
        // Aktif hesaplardan ilkini al
        List<SiteBankAccount> accounts = bankAccountRepository.findBySiteIdAndIsActiveTrue(siteId);
        
        if (accounts.isEmpty()) {
            // Eğer aktif hesap yoksa, demo hesap bilgisi döndür
            log.warn("No active bank account found for site: {}, returning demo account", siteId);
            BankAccountResponse demoAccount = new BankAccountResponse();
            demoAccount.setSiteId(siteId);
            demoAccount.setBankName("Ziraat Bankası");
            demoAccount.setIban("TR00 0000 0000 0000 0000 0000 00");
            demoAccount.setAccountHolder("Site Yönetimi A.Ş.");
            demoAccount.setBranch("Merkez Şubesi");
            demoAccount.setIsActive(true);
            return demoAccount;
        }
        
        return toResponse(accounts.get(0));
    }
    
    @Transactional(readOnly = true)
    public List<BankAccountResponse> getActiveBankAccounts(String siteId) {
        log.info("Fetching active bank accounts for site: {}", siteId);
        try {
            return bankAccountRepository.findBySiteIdAndIsActiveTrue(siteId)
                    .stream()
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching bank accounts: {}", e.getMessage());
            return List.of();
        }
    }
    
    @Transactional(readOnly = true)
    public List<BankAccountResponse> getAllBankAccounts(String siteId) {
        log.info("Fetching all bank accounts for site: {}", siteId);
        return bankAccountRepository.findBySiteId(siteId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public BankAccountResponse createBankAccount(CreateBankAccountRequest request) {
        log.info("Creating bank account for site: {}", request.getSiteId());
        
        SiteBankAccount account = new SiteBankAccount();
        account.setSiteId(request.getSiteId());
        account.setBankName(request.getBankName());
        account.setIban(request.getIban());
        account.setAccountHolder(request.getAccountHolder());
        account.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        
        SiteBankAccount saved = bankAccountRepository.save(account);
        log.info("Bank account created with ID: {}", saved.getId());
        return toResponse(saved);
    }
    
    @Transactional
    public BankAccountResponse updateBankAccount(String accountId, CreateBankAccountRequest request) {
        log.info("Updating bank account: {}", accountId);
        
        SiteBankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Banka hesabı", "id", accountId));
        
        account.setBankName(request.getBankName());
        account.setIban(request.getIban());
        account.setAccountHolder(request.getAccountHolder());
        if (request.getIsActive() != null) {
            account.setIsActive(request.getIsActive());
        }
        
        SiteBankAccount updated = bankAccountRepository.save(account);
        log.info("Bank account updated: {}", accountId);
        return toResponse(updated);
    }
    
    @Transactional
    public void deleteBankAccount(String accountId) {
        log.info("Deleting bank account: {}", accountId);
        
        SiteBankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Banka hesabı", "id", accountId));
        
        bankAccountRepository.delete(account);
        log.info("Bank account deleted: {}", accountId);
    }
    
    private BankAccountResponse toResponse(SiteBankAccount account) {
        BankAccountResponse response = new BankAccountResponse();
        response.setId(account.getId());
        response.setSiteId(account.getSiteId());
        response.setBankName(account.getBankName());
        response.setIban(account.getIban());
        response.setAccountHolder(account.getAccountHolder());
        response.setIsActive(account.getIsActive());
        return response;
    }
}
