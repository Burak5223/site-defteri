package com.sitedefteri.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class InviteUserRequest {
    @NotBlank
    private String fullName;
    
    @Email
    @NotBlank
    private String email;
    
    private String phone;
    
    @NotBlank
    private String siteId;
    
    private String apartmentId; // Optional - can be assigned later
    
    private String role; // admin, manager, resident, security
    
    private String password; // Optional - if not provided, temp password will be generated
}
