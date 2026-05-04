package com.sitedefteri.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class VerifyPhoneRequest {
    
    @NotBlank(message = "Telefon numarası gereklidir")
    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Geçerli bir telefon numarası giriniz")
    private String phoneNumber;
    
    @NotBlank(message = "Doğrulama kodu gereklidir")
    @Size(min = 6, max = 6, message = "Doğrulama kodu 6 haneli olmalıdır")
    private String verificationCode;
    
    // Alias for backward compatibility
    public String getCode() {
        return verificationCode;
    }
    
    public void setCode(String code) {
        this.verificationCode = code;
    }
}
