package com.sitedefteri.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CreateVisitorRequest {
    @NotBlank(message = "Daire ID gereklidir")
    private String apartmentId;
    
    @NotBlank(message = "Ziyaretçi adı gereklidir")
    @Size(min = 2, max = 100, message = "Ziyaretçi adı 2-100 karakter arası olmalıdır")
    private String visitorName;
    
    @Pattern(regexp = "^\\+?[0-9]{10,13}$", message = "Geçerli bir telefon numarası giriniz")
    private String visitorPhone;
    
    @NotNull(message = "Beklenen tarih gereklidir")
    private LocalDateTime expectedAt;
    
    private String siteId;
    
    @Size(max = 500, message = "Amaç en fazla 500 karakter olabilir")
    private String purpose;
    
    @Pattern(regexp = "^[0-9]{11}$", message = "Geçerli bir TC kimlik numarası giriniz (11 haneli)")
    private String visitorIdNumber;
    
    @Pattern(regexp = "^[0-9]{2}[A-Z]{1,3}[0-9]{2,4}$", message = "Geçerli bir plaka giriniz")
    private String vehiclePlate;
}
