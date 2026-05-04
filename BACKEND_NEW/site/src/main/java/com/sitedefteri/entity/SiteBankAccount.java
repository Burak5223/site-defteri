package com.sitedefteri.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "site_bank_accounts")
@Getter
@Setter
public class SiteBankAccount extends BaseEntity {
    
    @Column(name = "site_id", nullable = false)
    private String siteId;
    
    @Column(name = "bank_name", nullable = false)
    private String bankName;
    
    @Column(nullable = false)
    private String iban;
    
    @Column(name = "account_holder", nullable = false)
    private String accountHolder;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
}
