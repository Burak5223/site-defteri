package com.sitedefteri.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AssignApartmentRequest {
    @NotBlank
    private String apartmentId;
    
    @NotBlank
    private String assignmentType; // owner, resident, tenant
    
    private String startDate; // ISO date format
    private String endDate; // Optional for tenants
}
