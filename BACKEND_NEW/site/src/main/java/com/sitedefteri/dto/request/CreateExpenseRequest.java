package com.sitedefteri.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateExpenseRequest {
    
    private String siteId; // Optional - can be provided in URL path
    
    @NotBlank(message = "Category is required")
    private String category;
    
    @NotBlank(message = "Description is required")
    private String description;
    
    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private BigDecimal amount;
    
    private String currencyCode = "TRY"; // Default to TRY
    
    @NotNull(message = "Expense date is required")
    private LocalDate expenseDate;
    
    private String vendorName;
    private String invoiceNumber;
    private String invoiceUrl;
    private String paymentMethod;
    private String notes;
}
