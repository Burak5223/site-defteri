package com.sitedefteri.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateBankAccountRequest {
    
    @NotBlank(message = "Site ID is required")
    private String siteId;
    
    @NotBlank(message = "Bank name is required")
    private String bankName;
    
    @NotBlank(message = "IBAN is required")
    private String iban;
    
    @NotBlank(message = "Account holder is required")
    private String accountHolder;
    
    private Boolean isActive = true;
}
