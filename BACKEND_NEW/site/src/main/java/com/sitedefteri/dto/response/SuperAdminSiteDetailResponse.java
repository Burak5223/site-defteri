package com.sitedefteri.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuperAdminSiteDetailResponse {
    private String id;
    private String name;
    private String address;
    private String city;
    private String country;
    private Boolean isActive;
    
    // Abonelik Bilgileri
    private String subscriptionStatus;
    private LocalDate subscriptionStartDate;
    private LocalDate subscriptionEndDate;
    private BigDecimal monthlyFee;
    private Integer maxApartments;
    private Integer maxUsers;
    
    // İstatistikler
    private Long totalApartments;
    private Long totalResidents;
    private Long totalManagers;
    private Long openTickets;
    private Long pendingDues;
    private Long waitingPackages;
    
    // Finansal
    private BigDecimal monthlyIncome;
    private BigDecimal yearlyIncome;
    private BigDecimal totalExpenses;
    private BigDecimal balance;
    
    // Performans
    private Double performanceScore;
    private Double dueCollectionRate;
    private Double ticketResolutionRate;
    private Double occupancyRate;
    
    // Yöneticiler
    private List<UserResponse> managers;
}
