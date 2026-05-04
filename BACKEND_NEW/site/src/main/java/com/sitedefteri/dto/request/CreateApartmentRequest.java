package com.sitedefteri.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateApartmentRequest {
    
    @NotBlank(message = "Daire numarası gereklidir")
    private String unitNumber;
    
    @NotNull(message = "Kat numarası gereklidir")
    private Integer floor;
    
    private String unitType; // 1+1, 2+1, 3+1, etc.
    
    private BigDecimal area; // m²
    
    private Integer bedrooms;
    
    private Integer bathrooms;
    
    private String status; // dolu, bos, tadilatta
}
