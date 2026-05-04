package com.sitedefteri.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateMaintenanceEquipmentRequest {
    
    @NotBlank(message = "Ekipman adı gereklidir")
    private String equipmentName;
    
    @NotBlank(message = "Ekipman tipi gereklidir")
    private String equipmentType;
    
    @NotNull(message = "Son bakım tarihi gereklidir")
    private LocalDate lastMaintenanceDate;
    
    @NotNull(message = "Bakım periyodu gereklidir")
    @Positive(message = "Bakım periyodu pozitif olmalıdır")
    private Integer maintenanceIntervalDays;
    
    private String notes;
}
