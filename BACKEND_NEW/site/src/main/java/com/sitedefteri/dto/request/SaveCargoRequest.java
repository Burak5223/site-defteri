package com.sitedefteri.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for saving cargo with validation
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SaveCargoRequest {

    @NotNull(message = "Site ID zorunludur")
    private String siteId;

    @NotBlank(message = "Alıcı adı zorunludur")
    @Pattern(regexp = "^[A-Za-zçğıöşüÇĞİÖŞÜ ]+$", message = "Alıcı adı sadece harf ve boşluk içerebilir")
    private String fullName;

    @NotBlank(message = "Takip numarası zorunludur")
    @Pattern(regexp = "^\\d+$", message = "Takip numarası sadece rakam içermelidir")
    private String trackingNumber;

    @NotBlank(message = "Tarih zorunludur")
    @Pattern(regexp = "^(\\d{2}/\\d{2}/\\d{4}|\\d{4}-\\d{2}-\\d{2})$", 
             message = "Tarih formatı geçersiz (GG/AA/YYYY veya YYYY-AA-GG olmalı)")
    private String date;

    private String cargoCompany;

    @Pattern(regexp = "^[A-Za-z0-9\\-/]*$", message = "Daire numarası geçersiz format")
    private String apartmentNumber;

    private String notes;

    private Boolean aiExtracted;

    private Long aiExtractionLogId;

    private String securityUserId;
}
