package com.sitedefteri.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    
    @NotBlank(message = "Ad soyad gereklidir")
    @Size(min = 3, max = 100, message = "Ad soyad 3-100 karakter arasında olmalıdır")
    private String fullName;
    
    @NotBlank(message = "Telefon numarası gereklidir")
    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Geçerli bir telefon numarası giriniz")
    private String phoneNumber;
    
    @NotBlank(message = "Şifre gereklidir")
    @Size(min = 6, max = 100, message = "Şifre en az 6 karakter olmalıdır")
    private String password;
    
    private String email; // Opsiyonel
    
    private String siteId; // Opsiyonel - davet ile geliyorsa
    
    private String invitationToken; // Opsiyonel - davet ile geliyorsa
}
