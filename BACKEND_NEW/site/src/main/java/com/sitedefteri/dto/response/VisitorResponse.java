package com.sitedefteri.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class VisitorResponse {
    private String id;
    private String apartmentId;
    private String visitorName;
    private String visitorPhone;
    private String visitorIdNumber;
    private String vehiclePlate;
    private String purpose;
    private LocalDateTime expectedAt;
    private LocalDateTime arrivedAt;
    private LocalDateTime leftAt;
    private String status; // pending, active, completed
    private String notes;
}
