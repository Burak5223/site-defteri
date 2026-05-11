package com.sitedefteri.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateResidentRequest {
    
    @NotBlank(message = "Ad Soyad zorunludur")
    private String fullName;
    
    @NotBlank(message = "Email zorunludur")
    @Email(message = "Geçerli bir email adresi giriniz")
    private String email;
    
    private String phone;
    
    @NotBlank(message = "Blok adı zorunludur")
    private String blockName;
    
    @NotBlank(message = "Daire numarası zorunludur")
    private String unitNumber;
    
    @NotBlank(message = "Sakin tipi zorunludur")
    private String residentType; // "owner" or "tenant"
    
    @NotBlank(message = "Site ID zorunludur")
    private String siteId;
    
    private String password; // Optional, will generate if not provided
    
    private Boolean createProfile = true; // Flag to create full resident profile
}