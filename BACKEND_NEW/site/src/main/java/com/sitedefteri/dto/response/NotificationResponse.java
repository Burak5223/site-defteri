package com.sitedefteri.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NotificationResponse {
    private String id;
    private String userId;
    private String siteId;
    private String title;
    private String body;
    private String notificationType;
    private String relatedType;
    private String relatedId;
    private Boolean isRead;
    private LocalDateTime readAt;
    private String actionUrl;
    private LocalDateTime createdAt;
}
