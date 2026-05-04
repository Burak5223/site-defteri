package com.sitedefteri.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    // Email or phone number - at least one must be provided
    private String email;
    private String phoneNumber;
    
    @NotBlank
    private String password;
}
