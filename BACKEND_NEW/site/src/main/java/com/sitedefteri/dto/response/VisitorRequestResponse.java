package com.sitedefteri.dto.response;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class VisitorRequestResponse {
    private String id;
    private String apartmentId;
    private String apartmentNumber;
    private String siteId;
    private String requestedBy;
    private String requestedByName;
    private LocalDateTime requestDate;
    private LocalDateTime expectedVisitDate;
    private String status; // pending, approved, rejected, cancelled
    private String notes;
    private String reviewedBy;
    private String reviewedByName;
    private LocalDateTime reviewedAt;
    private String reviewNotes;
    private List<VisitorItemResponse> visitors;
    
    @Data
    public static class VisitorItemResponse {
        private String id;
        private String visitorName;
        private String visitorPhone;
        private String vehiclePlate;
        private LocalDateTime stayStartDate; // Kalış başlangıç tarihi
        private Integer stayDurationDays; // Kaç gün kalacak
        private String itemNotes;
    }
}
