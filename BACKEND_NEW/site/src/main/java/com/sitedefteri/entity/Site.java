package com.sitedefteri.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "sites")
@Getter
@Setter
public class Site extends BaseEntity {
    
    @Column(nullable = false)
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String address;
    
    private String city;
    private String country;
    
    @Column(name = "postal_code", length = 20)
    private String postalCode;
    
    @Column(name = "subscription_status", nullable = false, length = 20)
    private String subscriptionStatus = "aktif"; // aktif, askida, iptal, suresi_dolmus
    
    @Column(name = "subscription_expiry")
    private LocalDate subscriptionExpiry;
    
    @Column(name = "commission_rate", precision = 5, scale = 2)
    private BigDecimal commissionRate = new BigDecimal("2.00");
    
    @Column(name = "owner_id", length = 36)
    private String ownerId;
    
    @Column(name = "logo_url", columnDefinition = "TEXT")
    private String logoUrl;
    
    @Column(length = 50)
    private String timezone = "UTC";
    
    @Column(columnDefinition = "JSON")
    private String settings;
}
