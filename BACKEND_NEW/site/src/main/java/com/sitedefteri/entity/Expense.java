package com.sitedefteri.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "expenses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Expense extends BaseEntity {
    
    @Column(name = "site_id", nullable = false, length = 36)
    private String siteId;
    
    @Column(name = "financial_period_id", length = 36)
    private String financialPeriodId;
    
    @Column(nullable = false, length = 100)
    private String category; // elektrik, su, guvenlik, temizlik, bakim, diger
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;
    
    @Column(name = "currency_code", nullable = false, length = 3)
    private String currencyCode;
    
    @Column(name = "expense_date", nullable = false)
    private LocalDate expenseDate;
    
    @Column(name = "vendor_name", length = 255)
    private String vendorName;
    
    @Column(name = "invoice_number", length = 100)
    private String invoiceNumber;
    
    @Column(name = "invoice_url", columnDefinition = "TEXT")
    private String invoiceUrl;
    
    @Column(name = "payment_method", length = 50)
    private String paymentMethod;
    
    @Column(name = "paid_at")
    private java.time.LocalDateTime paidAt;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
}
