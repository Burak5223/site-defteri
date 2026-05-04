package com.sitedefteri.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateSiteRequest {
    
    @NotBlank(message = "Site adı gereklidir")
    @Size(min = 2, max = 255, message = "Site adı 2-255 karakter olmalıdır")
    private String name;
    
    @NotBlank(message = "Adres gereklidir")
    private String address;
    
    private String city;
    
    private String district;
    
    private String postalCode;
    
    private String phone;
    
    private String email;
    
    private String taxNumber;
    
    private String taxOffice;
    
    private String description;
    
    private Integer totalBlocks;
    
    private Integer totalApartments;
}
