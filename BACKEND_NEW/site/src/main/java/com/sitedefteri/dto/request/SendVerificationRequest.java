package com.sitedefteri.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class SendVerificationRequest {
    
    @NotBlank(message = "Telefon numarası gereklidir")
    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Geçerli bir telefon numarası giriniz")
    private String phoneNumber;
    
    @Pattern(regexp = "^(register|login|password_reset|phone_change)$", 
             message = "Geçersiz amaç")
    private String purpose = "register"; // Default: register
}
