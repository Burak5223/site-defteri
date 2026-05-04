package com.sitedefteri.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateSiteRequest {
    
    @Size(min = 2, max = 255, message = "Site adı 2-255 karakter olmalıdır")
    private String name;
    
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
