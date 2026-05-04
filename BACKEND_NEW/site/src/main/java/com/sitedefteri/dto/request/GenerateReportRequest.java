package com.sitedefteri.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenerateReportRequest {
    
    @NotBlank(message = "Rapor tipi belirtilmelidir")
    private String reportType; // financial, operational, performance
    
    @NotBlank(message = "Rapor adı boş olamaz")
    private String reportName;
    
    private String siteId; // null = tüm siteler
    
    @NotNull(message = "Başlangıç tarihi belirtilmelidir")
    private LocalDate startDate;
    
    @NotNull(message = "Bitiş tarihi belirtilmelidir")
    private LocalDate endDate;
    
    @NotBlank(message = "Dosya formatı belirtilmelidir")
    private String fileFormat; // pdf, excel
}
