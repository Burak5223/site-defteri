package com.sitedefteri.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateBulkAnnouncementRequest {
    
    @NotBlank(message = "Başlık boş olamaz")
    private String title;
    
    @NotBlank(message = "İçerik boş olamaz")
    private String content;
    
    @NotBlank(message = "Öncelik belirtilmelidir")
    private String priority; // urgent, important, normal, info
    
    @NotBlank(message = "Hedef tipi belirtilmelidir")
    private String targetType; // all_sites, specific_sites, all_managers
    
    private List<String> targetSiteIds; // targetType = specific_sites ise gerekli
    
    private LocalDateTime expiresAt;
}
