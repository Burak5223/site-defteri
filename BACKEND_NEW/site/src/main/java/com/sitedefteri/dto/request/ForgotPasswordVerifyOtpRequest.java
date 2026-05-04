package com.sitedefteri.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForgotPasswordVerifyOtpRequest {
    
    @NotBlank(message = "Telefon numarası gereklidir")
    private String phoneNumber;
    
    @NotBlank(message = "OTP kodu gereklidir")
    private String otpCode;
}
