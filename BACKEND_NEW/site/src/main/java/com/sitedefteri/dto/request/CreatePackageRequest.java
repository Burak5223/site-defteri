package com.sitedefteri.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreatePackageRequest {
    @NotBlank(message = "Daire ID gereklidir")
    private String apartmentId;
    
    @Size(max = 100, message = "Takip numarası en fazla 100 karakter olabilir")
    private String trackingNumber;
    
    @Size(max = 500, message = "Açıklama en fazla 500 karakter olabilir")
    private String description;
    
    @NotBlank(message = "Kargo firması gereklidir")
    @Size(max = 100, message = "Kargo firması en fazla 100 karakter olabilir")
    private String courierName;
    
    @Size(max = 100, message = "Gönderen adı en fazla 100 karakter olabilir")
    private String senderName;
    
    @Size(max = 100, message = "Alıcı adı en fazla 100 karakter olabilir")
    private String recipientName;
    
    @Size(max = 50, message = "Paket boyutu en fazla 50 karakter olabilir")
    private String packageSize;
    
    private String photoUrl;
    
    private String notes;
    
    @Size(max = 50, message = "Teslim kodu en fazla 50 karakter olabilir")
    private String deliveryCode;  // Optional code from courier company
    
    private String blockId;
    
    private String siteId;
}
