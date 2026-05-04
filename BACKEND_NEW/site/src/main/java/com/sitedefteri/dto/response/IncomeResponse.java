package com.sitedefteri.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class IncomeResponse {
    
    private String id;
    private String siteId;
    private String financialPeriodId;
    private String category;
    private String description;
    private BigDecimal amount;
    private String currencyCode;
    private LocalDate incomeDate;
    private String payerName;
    private String paymentMethod;
    private String receiptNumber;
    private String receiptUrl;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
