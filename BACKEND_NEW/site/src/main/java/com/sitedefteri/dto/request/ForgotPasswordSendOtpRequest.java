package com.sitedefteri.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForgotPasswordSendOtpRequest {
    
    @NotBlank(message = "Kullanıcı adı gereklidir")
    private String username;
    
    @NotBlank(message = "Telefon numarası gereklidir")
    private String phoneNumber;
}
