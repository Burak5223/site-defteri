package com.sitedefteri.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreateIncomeRequest {
    
    private String siteId; // Optional - can be provided in URL path
    
    @NotBlank(message = "Kategori gereklidir")
    private String category;
    
    @NotBlank(message = "Açıklama gereklidir")
    private String description;
    
    @NotNull(message = "Tutar gereklidir")
    @Positive(message = "Tutar pozitif olmalıdır")
    private BigDecimal amount;
    
    private String currencyCode = "TRY";
    
    @NotNull(message = "Gelir tarihi gereklidir")
    private LocalDate incomeDate;
    
    private String payerName;
    
    private String paymentMethod;
    
    private String receiptNumber;
    
    private String receiptUrl;
    
    private String notes;
}
