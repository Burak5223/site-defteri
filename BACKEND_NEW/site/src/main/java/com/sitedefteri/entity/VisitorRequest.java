package com.sitedefteri.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "visitor_requests")
@Getter
@Setter
public class VisitorRequest extends BaseEntity {
    
    @Column(name = "apartment_id", nullable = false)
    private String apartmentId;
    
    @Column(name = "site_id", nullable = false)
    private String siteId;
    
    @Column(name = "requested_by", nullable = false)
    private String requestedBy; // User ID of resident
    
    @Column(name = "request_date", nullable = false)
    private LocalDateTime requestDate = LocalDateTime.now();
    
    @Column(name = "expected_visit_date", nullable = false)
    private LocalDateTime expectedVisitDate;
    
    @Column(nullable = false, length = 20)
    private String status = "pending"; // pending, approved, rejected, cancelled
    
    @Column(columnDefinition = "TEXT")
    private String notes; // Resident's notes
    
    @Column(name = "reviewed_by")
    private String reviewedBy; // User ID of security/admin who reviewed
    
    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;
    
    @Column(name = "review_notes", columnDefinition = "TEXT")
    private String reviewNotes; // Security's notes
    
    @OneToMany(mappedBy = "visitorRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<VisitorRequestItem> visitors = new ArrayList<>();
    
    public void addVisitor(VisitorRequestItem visitor) {
        visitors.add(visitor);
        visitor.setVisitorRequest(this);
    }
    
    public void removeVisitor(VisitorRequestItem visitor) {
        visitors.remove(visitor);
        visitor.setVisitorRequest(null);
    }
}
