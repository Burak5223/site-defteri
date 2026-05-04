package com.sitedefteri.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class BulkDueRequest {
    @NotEmpty(message = "En az bir daire seçilmelidir")
    @Size(min = 1, max = 1000, message = "En fazla 1000 daireye toplu aidat atanabilir")
    private List<String> apartmentIds;
    
    @NotNull(message = "Tutar gereklidir")
    @DecimalMin(value = "0.01", message = "Tutar 0'dan büyük olmalıdır")
    private BigDecimal amount;
    
    @NotNull(message = "Son ödeme tarihi gereklidir")
    private LocalDate dueDate;
    
    @Size(max = 500, message = "Açıklama en fazla 500 karakter olabilir")
    private String description;
}
