package com.sitedefteri.dto.cargo;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for Gemini Vision API response
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GeminiExtractionResponse {
    @JsonProperty("full_name")
    private String fullName;
    
    @JsonProperty("tracking_number")
    private String trackingNumber;
    
    @JsonProperty("date")
    private String date;
    
    @JsonProperty("cargo_company")
    private String cargoCompany;
    
    @JsonProperty("apartment_number")
    private String apartmentNumber;
    
    @JsonProperty("notes")
    private String notes;
}
