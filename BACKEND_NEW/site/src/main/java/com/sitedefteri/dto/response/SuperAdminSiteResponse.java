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
public class SuperAdminSiteResponse {
    private String id;
    private String name;
    private String city;
    private String country;
    private Boolean isActive;
    private String subscriptionStatus; // active, suspended, cancelled
    private Long totalApartments;
    private Long totalResidents;
    private Long openTickets;
    private Long pendingDues;
    private Long waitingPackages;
    private BigDecimal yearlyIncome;
}
