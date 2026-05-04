package com.sitedefteri.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class CreateBlockRequest {
    
    @NotBlank(message = "Blok adı gereklidir")
    private String name;
    
    private String description;
    
    @NotNull(message = "Toplam kat sayısı gereklidir")
    @Positive(message = "Kat sayısı pozitif olmalıdır")
    private Integer totalFloors;
}
