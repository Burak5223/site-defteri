package com.sitedefteri.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UploadCargoPhotoRequest {
    
    @NotBlank(message = "Photo base64 is required")
    private String photoBase64;
    
    @NotBlank(message = "Site ID is required")
    private String siteId;
    
    @NotBlank(message = "Security user ID is required")
    private String securityUserId;
}
