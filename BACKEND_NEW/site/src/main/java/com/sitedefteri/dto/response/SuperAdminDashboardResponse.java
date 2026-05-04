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
public class SuperAdminDashboardResponse {
    private Long totalSites;
    private Long totalManagers;
    private Long totalResidents;
    private Long totalApartments;
    private BigDecimal monthlyIncome;
    private Long openTickets;
    private Long unpaidDues;
    private Long waitingPackages;
    private Double performanceScore; // 0-5 arası
}
