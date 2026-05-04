package com.sitedefteri.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "maintenance_equipment")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceEquipment {
    
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", length = 36)
    private String id;
    
    @Column(name = "site_id", nullable = false, length = 36)
    private String siteId;
    
    @Column(name = "equipment_name", nullable = false, length = 200)
    private String equipmentName;
    
    @Column(name = "equipment_type", nullable = false, length = 50)
    private String equipmentType;
    
    @Column(name = "last_maintenance_date", nullable = false)
    private LocalDate lastMaintenanceDate;
    
    @Column(name = "next_maintenance_date")
    private LocalDate nextMaintenanceDate;
    
    @Column(name = "maintenance_interval_days", nullable = false)
    private Integer maintenanceIntervalDays;
    
    @Column(name = "status", nullable = false)
    private String status = "active";
    
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "created_by")
    private String createdBy;
    
    @Column(name = "updated_by")
    private String updatedBy;
    
    @Column(name = "assigned_to")
    private String assignedTo;
    
    @Column(name = "location")
    private String location;
    
    // Duplicate columns in DB - map but don't use
    @Column(name = "maintenance_period_days", insertable = false, updatable = false)
    private Integer maintenancePeriodDays;
    
    @Column(name = "name", insertable = false, updatable = false)
    private String name;
    
    @Column(name = "type", insertable = false, updatable = false)
    private String type;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null || status.isEmpty()) {
            status = "active";
        }
        if (isActive == null) {
            isActive = true;
        }
        if (isDeleted == null) {
            isDeleted = false;
        }
        // Calculate next maintenance date
        if (nextMaintenanceDate == null && lastMaintenanceDate != null && maintenanceIntervalDays != null) {
            nextMaintenanceDate = lastMaintenanceDate.plusDays(maintenanceIntervalDays);
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
