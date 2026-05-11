package com.sitedefteri.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserResponse {
    private String id;
    private String userId; // Alias for id (for mobile compatibility)
    private String fullName;
    private String email;
    private String phone;
    private String role; // User role (ADMIN, RESIDENT, etc.)
    private java.util.List<String> roles; // User roles list
    private String siteId;
    private String siteName; // Site name for display
    private String apartmentId; // User's apartment ID from residency_history
    private String profilePhotoUrl;
    private String status;
    private Boolean emailVerified;
    private Boolean phoneVerified;
    private String preferredLanguage;
    private LocalDateTime createdAt;
    
    // Apartment information
    private String blockName;
    private String unitNumber;
    private String residentType; // "owner" or "tenant"
    
    // QR Token for package delivery
    private String userQrToken;
}
