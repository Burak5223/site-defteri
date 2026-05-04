package com.sitedefteri.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "visitors")
@Getter
@Setter
public class Visitor extends BaseEntity {
    
    @Column(name = "apartment_id", nullable = false)
    private String apartmentId;
    
    @Column(name = "site_id", nullable = false)
    private String siteId;
    
    @Column(name = "visitor_name", nullable = false)
    private String visitorName;
    
    @Column(name = "visitor_phone")
    private String visitorPhone;
    
    @Column(name = "vehicle_plate")
    private String vehiclePlate;
    
    @Column(name = "stay_start_date")
    private LocalDateTime stayStartDate; // Kalış başlangıç tarihi
    
    @Column(name = "stay_end_date")
    private LocalDateTime stayEndDate; // Kalış bitiş tarihi (otomatik hesaplanır)
    
    @Column(name = "is_active")
    private Boolean isActive = true; // Süre bitince otomatik false olur
    
    private String purpose;
    
    @Column(name = "expected_at")
    private LocalDateTime expectedAt;
    
    @Column(name = "arrived_at")
    private LocalDateTime arrivedAt;
    
    @Column(name = "left_at")
    private LocalDateTime leftAt;
    
    @Column(nullable = false)
    private String status = "expected";
    
    @Column(name = "authorized_by")
    private String authorizedBy;
    
    @Column(name = "checked_in_by")
    private String checkedInBy;
    
    private String notes;
}
