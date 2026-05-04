package com.sitedefteri.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateTaskRequest {
    @NotBlank(message = "Başlık gereklidir")
    @Size(min = 3, max = 200, message = "Başlık 3-200 karakter arası olmalıdır")
    private String title;
    
    @Size(max = 2000, message = "Açıklama en fazla 2000 karakter olabilir")
    private String description;
    
    @NotBlank(message = "Atanan rol gereklidir")
    private String assignedTo; // Artık rol olarak kullanılıyor: ROLE_SECURITY, ROLE_CLEANING, vb.
    
    @NotNull(message = "Bitiş tarihi gereklidir")
    private LocalDate dueDate;
    
    @NotBlank(message = "Görev tipi gereklidir")
    private String taskType;
    
    @Size(max = 200, message = "Konum en fazla 200 karakter olabilir")
    private String location;
}
