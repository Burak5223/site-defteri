package com.sitedefteri.dto.response;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class MaintenanceEquipmentResponse {
    private String id;
    private String equipmentName;
    private String equipmentType;
    private LocalDate lastMaintenanceDate;
    private LocalDate nextMaintenanceDate;
    private Integer maintenanceIntervalDays;
    private String status;
    private String notes;
    private LocalDateTime createdAt;
}
