package com.sitedefteri.dto.request;

import jakarta.validation.constraints.Email;
import lombok.Data;

@Data
public class UpdateUserRequest {
    private String fullName;
    
    @Email
    private String email;
    
    private String phone;
    private String profilePhotoUrl;
    private String status; // aktif, askida, yasakli
    private String preferredLanguage;
}
