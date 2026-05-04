package com.sitedefteri.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "payments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Payment extends BaseEntity {
    
    @Column(name = "due_id", nullable = false, length = 36)
    private String dueId;
    
    @Column(name = "installment_id", length = 36)
    private String installmentId;
    
    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;
    
    @Column(name = "site_id", length = 36)
    private String siteId;
    
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;
    
    @Column(name = "system_commission_amount", precision = 10, scale = 2)
    private BigDecimal systemCommissionAmount = BigDecimal.ZERO;
    
    @Column(name = "currency_code", nullable = false, length = 3)
    private String currencyCode;
    
    @Column(name = "payment_method", nullable = false, length = 50)
    private String paymentMethod; // kredi_karti, havale_eft, nakit, cek
    
    @Column(length = 50)
    private String provider;
    
    @Column(name = "provider_payment_id", length = 255)
    private String providerPaymentId;
    
    @Column(name = "idempotency_key", nullable = false, unique = true)
    private String idempotencyKey;
    
    @Column(nullable = false, length = 20)
    private String status; // bekliyor, isleniyor, tamamlandi, basarisiz, iade_edildi, iptal_edildi
    
    @Column(columnDefinition = "JSON")
    private String metadata;
    
    @Column(name = "failure_reason", columnDefinition = "TEXT")
    private String failureReason;
    
    @Column(name = "receipt_number", length = 50, unique = true)
    private String receiptNumber;
    
    @Column(name = "receipt_pdf_url", columnDefinition = "TEXT")
    private String receiptPdfUrl;
    
    @Column(name = "receipt_url", columnDefinition = "TEXT")
    private String receiptUrl;
    
    @Column(name = "payment_date")
    private java.time.LocalDateTime paymentDate;
    
    @Column(name = "ip_address", length = 45)
    private String ipAddress;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    @Column(name = "refunded_at")
    private java.time.LocalDateTime refundedAt;
    
    @Column(name = "refund_reason", columnDefinition = "TEXT")
    private String refundReason;
}
