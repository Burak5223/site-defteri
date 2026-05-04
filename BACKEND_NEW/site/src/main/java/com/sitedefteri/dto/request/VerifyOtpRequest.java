package com.sitedefteri.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class VerifyOtpRequest {
    
    @NotBlank(message = "Telefon numarası gereklidir")
    private String phoneNumber;
    
    @NotBlank(message = "OTP kodu gereklidir")
    @Size(min = 6, max = 6, message = "OTP kodu 6 haneli olmalıdır")
    private String otpCode;
}
