package com.sitedefteri.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateTicketRequest {
    @NotBlank(message = "Başlık gereklidir")
    @Size(min = 3, max = 200, message = "Başlık 3-200 karakter arası olmalıdır")
    private String title;
    
    @NotBlank(message = "Açıklama gereklidir")
    @Size(min = 5, max = 2000, message = "Açıklama 5-2000 karakter arası olmalıdır")
    private String description;
    
    @NotBlank(message = "Kategori gereklidir")
    private String category;
    
    private String priority;
    
    private String apartmentId; // Optional - can be null for site-wide issues
}
