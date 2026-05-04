package com.sitedefteri.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "apartments")
@Getter
@Setter
public class Apartment extends BaseEntity {
    
    @Column(name = "block_id", nullable = false)
    private String blockId;
    
    @Column(name = "unit_number", nullable = false)
    private String unitNumber;
    
    private Integer floor;
    
    @Column(name = "unit_type")
    private String unitType;
    
    private BigDecimal area;
    
    private Integer bedrooms;
    
    private Integer bathrooms;
    
    @Enumerated(EnumType.STRING)
    private ApartmentStatus status = ApartmentStatus.bos;
    
    @Column(name = "owner_user_id")
    private String ownerUserId;
    
    @Column(name = "current_resident_id")
    private String currentResidentId;
    
    @Column(name = "site_id")
    private String siteId;
    
    @Column(name = "block_name")
    private String blockName;
    
    public enum ApartmentStatus {
        dolu, bos, tadilatta
    }
}
