package com.sitedefteri.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SiteComparisonResponse {
    private String siteId;
    private String siteName;
    private Long totalApartments;
    private Long totalResidents;
    private Double occupancyRate;
    private BigDecimal monthlyIncome;
    private Double dueCollectionRate;
    private Double ticketResolutionRate;
    private Double performanceScore;
    private Long openTickets;
    private Long pendingDues;
}
