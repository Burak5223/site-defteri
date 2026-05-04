package com.sitedefteri.dto.cargo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for cargo form data extracted from AI or entered manually
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CargoFormData {
    private String fullName;
    private String trackingNumber;
    private String date;
    private String cargoCompany;
    private String apartmentNumber;
    private String notes;
    private Boolean aiExtracted;
    private Long aiExtractionLogId;
}
