package com.sitedefteri.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class CreateVisitorRequestRequest {
    
    @NotNull(message = "Expected visit date is required")
    private LocalDateTime expectedVisitDate;
    
    private String notes; // General notes from resident
    
    @NotEmpty(message = "At least one visitor is required")
    @Valid
    private List<VisitorItemRequest> visitors;
    
    @Data
    public static class VisitorItemRequest {
        @NotNull(message = "Visitor name is required")
        private String visitorName;
        
        private String visitorPhone;
        private String vehiclePlate;
        
        @NotNull(message = "Stay start date is required")
        private LocalDateTime stayStartDate; // Kalış başlangıç tarihi
        
        private Integer stayDurationDays = 1; // Kaç gün kalacak (varsayılan 1 gün)
        
        private String itemNotes; // Notes specific to this visitor
    }
}
