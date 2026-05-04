package com.sitedefteri.dto.response;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class PaymentResponse {
    private String id;
    private String dueId;
    private String userId;
    private String userName; // Kullanıcı adı soyadı
    private String apartmentNumber; // Daire numarası (örn: "A-12")
    private BigDecimal amount;
    private String currencyCode;
    private String paymentMethod;
    private String status; // bekliyor, tamamlandi, basarisiz, iptal_edildi
    private String receiptUrl;
    private String receiptNumber;
    private LocalDateTime paymentDate;
    private LocalDateTime createdAt;
    private String notes;
}
