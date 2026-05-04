package com.sitedefteri.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TicketResponse {
    private String id;
    private String title;
    private String description;
    private String category;
    private String status;
    private String priority;
    private LocalDateTime createdAt;
}
