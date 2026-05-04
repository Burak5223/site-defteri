package com.sitedefteri.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CollectPackageRequest {
    
    @NotBlank(message = "QR token gerekli")
    private String qrToken;
}
