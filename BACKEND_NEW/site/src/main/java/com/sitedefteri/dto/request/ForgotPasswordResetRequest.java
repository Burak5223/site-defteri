package com.sitedefteri.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ForgotPasswordResetRequest {
    
    @NotBlank(message = "Telefon numarası gereklidir")
    private String phoneNumber;
    
    @NotBlank(message = "OTP kodu gereklidir")
    private String otpCode;
    
    @NotBlank(message = "Yeni şifre gereklidir")
    @Size(min = 6, message = "Şifre en az 6 karakter olmalıdır")
    private String newPassword;
}
