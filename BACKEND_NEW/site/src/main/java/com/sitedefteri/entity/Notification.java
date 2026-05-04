package com.sitedefteri.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter
@Setter
public class Notification extends BaseEntity {
    
    @Column(name = "user_id", nullable = false)
    private String userId;
    
    @Column(name = "site_id")
    private String siteId;
    
    @Column(nullable = false)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String body;
    
    @Column(name = "type", nullable = false)
    private String type; // Notification type (legacy column)
    
    @Column(name = "notification_type")
    private String notificationType; // info, warning, success, error
    
    @Column(name = "related_type")
    private String relatedType; // package, ticket, due, announcement, etc.
    
    @Column(name = "related_id")
    private String relatedId;
    
    @Column(name = "is_read")
    private Boolean isRead = false;
    
    @Column(name = "read_at")
    private LocalDateTime readAt;
    
    @Column(name = "action_url")
    private String actionUrl;
}
