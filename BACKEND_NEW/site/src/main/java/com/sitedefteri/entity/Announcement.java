package com.sitedefteri.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "announcements")
@Getter
@Setter
public class Announcement extends BaseEntity {
    
    @Column(name = "site_id", nullable = false)
    private String siteId;
    
    @Column(nullable = false)
    private String title;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String body;
    
    @Column(name = "target_audience")
    private String targetAudience = "herkes";
    
    @Enumerated(EnumType.STRING)
    private Priority priority = Priority.orta;
    
    @Column(name = "is_pinned")
    private Boolean isPinned = false;
    
    @Column(name = "published_at")
    private LocalDateTime publishedAt;
    
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
    
    @Column(name = "created_by")
    private String createdBy;
    
    @Column(name = "updated_by")
    private String updatedBy;
    
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;
    
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
    
    @Column(name = "deleted_by")
    private String deletedBy;
    
    public enum Priority {
        dusuk, orta, yuksek, acil
    }
}
