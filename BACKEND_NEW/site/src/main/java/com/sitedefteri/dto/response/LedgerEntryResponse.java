package com.sitedefteri.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LedgerEntryResponse {
    private String id;
    private LocalDateTime date;
    private String type; // INCOME, EXPENSE
    private String category;
    private String description;
    private BigDecimal amount;
    private String currencyCode;
    private BigDecimal balance;
    private String referenceId;
    private String referenceType; // DUE, PAYMENT, EXPENSE
}
