package com.sitedefteri.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreateDueRequest {
    @NotBlank
    private String apartmentId;
    
    @NotNull
    private BigDecimal amount;
    
    @NotNull
    private LocalDate dueDate;
    
    private String description;
}
