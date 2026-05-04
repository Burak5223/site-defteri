package com.sitedefteri.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Super Admin Dashboard İstatistikleri
 * Tüm sitelerden toplanan gerçek veriler
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    
    // Genel İstatistikler
    private Long totalSites;              // Toplam site sayısı
    private Long totalManagers;           // Toplam yönetici sayısı
    private Long totalResidents;          // Toplam sakin sayısı
    private Long totalApartments;         // Toplam daire sayısı
    private Double averagePerformance;    // Ortalama performans (5 üzerinden)
    
    // Finansal İstatistikler
    private BigDecimal monthlyIncome;     // Aylık gelir
    private BigDecimal monthlyExpense;    // Aylık gider
    private BigDecimal totalBalance;      // Toplam bakiye
    private Double incomeGrowth;          // Gelir artış oranı (%)
    
    // Aidat İstatistikleri
    private Long totalDues;               // Toplam aidat sayısı
    private Long paidDues;                // Ödenen aidat sayısı
    private Long unpaidDues;              // Ödenmemiş aidat sayısı
    private BigDecimal unpaidAmount;      // Ödenmemiş aidat tutarı
    private Double collectionRate;        // Tahsilat oranı (%)
    
    // Arıza/Ticket İstatistikleri
    private Long totalTickets;            // Toplam arıza sayısı
    private Long openTickets;             // Açık arıza sayısı
    private Long inProgressTickets;       // İşlemde arıza sayısı
    private Long resolvedTickets;         // Çözülen arıza sayısı
    private Long closedTickets;           // Kapatılan arıza sayısı
    private Double resolutionRate;        // Çözüm oranı (%)
    
    // Paket İstatistikleri
    private Long totalPackages;           // Toplam paket sayısı
    private Long waitingPackages;         // Bekleyen paket sayısı
    private Long deliveredPackages;       // Teslim edilen paket sayısı
    private Double deliveryRate;          // Teslim oranı (%)
    
    // Mesaj İstatistikleri
    private Long totalMessages;           // Toplam mesaj sayısı
    private Long unreadMessages;          // Okunmamış mesaj sayısı
    
    // Duyuru İstatistikleri
    private Long totalAnnouncements;      // Toplam duyuru sayısı
    private Long activeAnnouncements;     // Aktif duyuru sayısı
    
    // Görev İstatistikleri
    private Long totalTasks;              // Toplam görev sayısı
    private Long completedTasks;          // Tamamlanan görev sayısı
    private Long pendingTasks;            // Bekleyen görev sayısı
    
    // Bakım İstatistikleri
    private Long totalMaintenanceEquipment;  // Toplam bakım ekipmanı
    private Long upcomingMaintenance;        // Yaklaşan bakım
    private Long overdueMaintenance;         // Gecikmiş bakım
}
