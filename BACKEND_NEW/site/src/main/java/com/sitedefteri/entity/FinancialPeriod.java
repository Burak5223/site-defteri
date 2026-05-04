package com.sitedefteri.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "financial_periods")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class FinancialPeriod extends BaseEntity {
    
    @Column(name = "site_id", nullable = false, length = 36)
    private String siteId;
    
    @Column(nullable = false)
    private Integer year;
    
    @Column(nullable = false)
    private Integer month;
    
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;
    
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;
    
    @Column(nullable = false, length = 20)
    private String status; // draft, active, closed
    
    @Column(name = "closed_at")
    private java.time.LocalDateTime closedAt;
    
    @Column(name = "closed_by", length = 36)
    private String closedBy;
}
