package com.sitedefteri.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "blocks")
@Getter
@Setter
public class Block extends BaseEntity {
    
    @Column(name = "site_id", nullable = false)
    private String siteId;
    
    @Column(nullable = false)
    private String name;
    
    private String description;
    
    @Column(name = "total_floors")
    private Integer totalFloors = 0;
}
