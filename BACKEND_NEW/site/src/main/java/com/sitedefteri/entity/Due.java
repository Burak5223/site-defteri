package com.sitedefteri.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "dues")
@Getter
@Setter
public class Due extends BaseEntity {
    
    @Column(name = "financial_period_id")
    private String financialPeriodId;
    
    @Column(name = "apartment_id", nullable = false)
    private String apartmentId;
    
    @Column(name = "base_amount", nullable = false)
    private BigDecimal baseAmount;
    
    @Column(name = "total_amount", nullable = false)
    private BigDecimal totalAmount;
    
    @Column(name = "currency_code", nullable = false)
    private String currencyCode = "TRY";
    
    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DueStatus status = DueStatus.bekliyor;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(columnDefinition = "JSON")
    private String breakdown;
    
    @Column(name = "bank_name")
    private String bankName;
    
    @Column
    private String iban;
    
    @Column(name = "account_holder")
    private String accountHolder;
    
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
    
    @Column(name = "deleted_by")
    private String deletedBy;
    
    public enum DueStatus {
        bekliyor, kismi_odendi, odendi, gecikmis, iptal_edildi
    }
}
