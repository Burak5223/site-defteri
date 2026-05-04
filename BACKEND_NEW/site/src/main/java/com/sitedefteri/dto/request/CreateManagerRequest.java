package com.sitedefteri.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateManagerRequest {
    
    @NotBlank(message = "Email boş olamaz")
    @Email(message = "Geçerli bir email adresi giriniz")
    private String email;
    
    @NotBlank(message = "Şifre boş olamaz")
    private String password;
    
    @NotBlank(message = "Ad soyad boş olamaz")
    private String fullName;
    
    @NotBlank(message = "Telefon boş olamaz")
    private String phone;
    
    @NotNull(message = "Site ID boş olamaz")
    private String siteId;
}
