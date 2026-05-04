package com.sitedefteri.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "visitor_request_items")
@Getter
@Setter
public class VisitorRequestItem extends BaseEntity {
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private VisitorRequest visitorRequest;
    
    @Column(name = "visitor_name", nullable = false, length = 100)
    private String visitorName;
    
    @Column(name = "visitor_phone", length = 20)
    private String visitorPhone;
    
    @Column(name = "vehicle_plate", length = 20)
    private String vehiclePlate;
    
    @Column(name = "stay_start_date")
    private java.time.LocalDateTime stayStartDate; // Kalış başlangıç tarihi
    
    @Column(name = "stay_duration_days")
    private Integer stayDurationDays = 1; // Kaç gün kalacak (varsayılan 1 gün)
    
    @Column(name = "item_notes", columnDefinition = "TEXT")
    private String itemNotes; // Notes specific to this visitor
}
