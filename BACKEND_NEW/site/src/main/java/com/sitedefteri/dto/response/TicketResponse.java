package com.sitedefteri.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TicketResponse {
    private String id;
    private String ticketNumber;
    private String title;
    private String description;
    private String category;
    private String status;
    private String priority;
    private String userId;
    private String apartmentId;
    private String siteId;
    private String assignedTo;
    private String createdBy;
    private String updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;
}
