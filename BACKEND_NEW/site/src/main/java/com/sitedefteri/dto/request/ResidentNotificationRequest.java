package com.sitedefteri.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for resident cargo notification ("Kargom Var")
 * residentId, siteId, apartmentId, fullName will be populated from JWT token
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResidentNotificationRequest {

    // These fields will be populated from JWT token by the controller
    private String residentId;
    private String siteId;
    private String apartmentId;
    private String fullName;

    private String cargoCompany; // Optional cargo company name

    private String expectedDate; // Format: YYYY-MM-DD
    
    private String deliveryCode; // Optional delivery code from cargo company (max 50 chars)
    
    private String notes; // Optional notes
}
