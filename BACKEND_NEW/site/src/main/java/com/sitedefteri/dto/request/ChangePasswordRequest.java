package com.sitedefteri.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChangePasswordRequest {
    
    @NotBlank(message = "Mevcut şifre gereklidir")
    private String currentPassword;
    
    @NotBlank(message = "Yeni şifre gereklidir")
    @Size(min = 6, message = "Şifre en az 6 karakter olmalıdır")
    private String newPassword;
    
    @NotBlank(message = "Şifre tekrarı gereklidir")
    private String confirmPassword;
}
