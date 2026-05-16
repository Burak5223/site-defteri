package com.sitedefteri.dto.response;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class TaskResponse {
    private String id;
    private String title;
    private String description;
    private String assignedTo;
    private String taskType;
    private LocalDate dueDate;
    private String status;
    private LocalDateTime createdAt;
}
