package com.sitedefteri.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ScanQRRequest {
    
    @NotBlank(message = "User token gerekli")
    private String userToken;
}
