package com.sitedefteri.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseResponse {
    private String id;
    private String siteId;
    private String financialPeriodId;
    private String category;
    private String description;
    private BigDecimal amount;
    private String currencyCode;
    private LocalDate expenseDate;
    private String vendorName;
    private String invoiceNumber;
    private String invoiceUrl;
    private String paymentMethod;
    private LocalDateTime paidAt;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
