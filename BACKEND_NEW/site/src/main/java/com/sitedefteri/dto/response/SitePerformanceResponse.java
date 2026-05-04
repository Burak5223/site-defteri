package com.sitedefteri.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SitePerformanceResponse {
    private String siteId;
    private String siteName;
    private Double dueCollectionRate; // Aidat tahsilat oranı %
    private Double ticketResolutionRate; // Arıza çözüm oranı %
    private Double avgTicketResolutionDays; // Ortalama çözüm süresi (gün)
    private Double packageDeliveryRate; // Paket teslim oranı %
    private Double occupancyRate; // Doluluk oranı %
    private Double performanceScore; // Genel performans skoru (0-5)
}
