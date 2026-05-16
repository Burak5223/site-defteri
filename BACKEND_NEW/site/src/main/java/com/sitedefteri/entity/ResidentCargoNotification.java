package com.sitedefteri.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entity for resident cargo notifications ("Kargom Var" system)
 * Stores resident notifications for expected cargo deliveries
 */
@Entity
@Table(name = "resident_cargo_notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResidentCargoNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "resident_id", nullable = false, length = 36)
    private String residentId;

    @Column(name = "site_id", nullable = false, length = 36)
    private String siteId;

    @Column(name = "apartment_id", nullable = false, length = 36)
    private String apartmentId;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "full_name_normalized", nullable = false)
    private String fullNameNormalized;

    @Column(name = "cargo_company")
    private String cargoCompany;

    @Column(name = "expected_date")
    private LocalDate expectedDate;

    @Column(name = "delivery_code", length = 50)
    private String deliveryCode;

    @Column(name = "status", nullable = false, length = 50)
    private String status = "pending_match"; // pending_match, matched, expired

    @Column(name = "matched_package_id", length = 36)
    private String matchedPackageId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "matched_at")
    private LocalDateTime matchedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
