package com.sitedefteri.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "tickets")
@Getter
@Setter
public class Ticket extends BaseEntity {
    
    @Column(name = "ticket_number", unique = true, nullable = false)
    private String ticketNumber;
    
    @Column(name = "user_id", nullable = false)
    private String userId;
    
    @Column(name = "apartment_id")
    private String apartmentId;
    
    @Column(name = "site_id", nullable = false)
    private String siteId;
    
    @Column(name = "assigned_to")
    private String assignedTo;
    
    @Column(nullable = false)
    private String title;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;
    
    private String category;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketStatus status = TicketStatus.acik;
    
    @Enumerated(EnumType.STRING)
    private Priority priority = Priority.orta;
    
    @Column(name = "resolution_note", columnDefinition = "TEXT")
    private String resolutionNote;
    
    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;
    
    @Column(name = "resolved_by")
    private String resolvedBy;
    
    @Column(name = "closed_at")
    private LocalDateTime closedAt;
    
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;
    
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
    
    @Column(name = "deleted_by")
    private String deletedBy;
    
    @Column(name = "created_by")
    private String createdBy;
    
    @Column(name = "updated_by")
    private String updatedBy;
    
    public enum TicketStatus {
        acik, islemde, kullanici_bekleniyor, cozuldu, kapali, reddedildi
    }
    
    public enum Priority {
        dusuk, orta, yuksek, acil
    }
}
