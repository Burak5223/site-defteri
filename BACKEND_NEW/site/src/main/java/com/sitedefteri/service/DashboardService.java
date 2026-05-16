package com.sitedefteri.service;

import com.sitedefteri.dto.response.DashboardStatsResponse;
import com.sitedefteri.entity.Due;
import com.sitedefteri.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManagerFactory;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Dashboard Servisi
 * Super Admin için gerçek verilerden istatistikler üretir
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {
    
    private final SiteRepository siteRepository;
    private final UserRepository userRepository;
    private final ApartmentRepository apartmentRepository;
    private final DueRepository dueRepository;
    private final ExpenseRepository expenseRepository;
    private final TicketRepository ticketRepository;
    private final PackageRepository packageRepository;
    private final MessageRepository messageRepository;
    private final AnnouncementRepository announcementRepository;
    private final TaskRepository taskRepository;
    private final MaintenanceEquipmentRepository maintenanceEquipmentRepository;
    private final EntityManagerFactory entityManagerFactory;
    
    /**
     * Super Admin Dashboard İstatistiklerini Getir
     * Tüm veriler gerçek database'den çekilir
     */
    @Transactional(readOnly = true)
    public DashboardStatsResponse getSuperAdminStats() {
        log.info("Calculating super admin dashboard statistics from real data");
        
        DashboardStatsResponse stats = new DashboardStatsResponse();
        
        // Genel İstatistikler
        stats.setTotalSites(siteRepository.count());
        stats.setTotalManagers(countManagers());
        stats.setTotalResidents(countResidents());
        stats.setTotalApartments(apartmentRepository.count());
        stats.setAveragePerformance(calculateAveragePerformance());
        
        // Finansal İstatistikler
        calculateFinancialStats(stats);
        
        // Aidat İstatistikleri
        calculateDueStats(stats);
        
        // Arıza İstatistikleri
        calculateTicketStats(stats);
        
        // Paket İstatistikleri
        calculatePackageStats(stats);
        
        // Mesaj İstatistikleri
        calculateMessageStats(stats);
        
        // Duyuru İstatistikleri
        calculateAnnouncementStats(stats);
        
        // Görev İstatistikleri
        calculateTaskStats(stats);
        
        // Bakım İstatistikleri
        calculateMaintenanceStats(stats);
        
        log.info("Dashboard statistics calculated successfully");
        return stats;
    }
    
    /**
     * Yönetici sayısını hesapla
     * TODO: Role tablosu eklendiğinde güncellenecek
     */
    private Long countManagers() {
        // Şimdilik email'e göre sayıyoruz
        return userRepository.findAll().stream()
                .filter(u -> u.getEmail().contains("admin") || u.getEmail().contains("manager"))
                .count();
    }
    
    /**
     * Sakin sayısını hesapla
     */
    private Long countResidents() {
        return userRepository.findAll().stream()
                .filter(u -> !u.getEmail().contains("admin") && 
                            !u.getEmail().contains("manager") && 
                            !u.getEmail().contains("security"))
                .count();
    }
    
    /**
     * Ortalama performans hesapla
     * Tahsilat oranı + Arıza çözüm oranı + Teslim oranı / 3
     */
    private Double calculateAveragePerformance() {
        double collectionRate = calculateCollectionRate();
        double resolutionRate = calculateResolutionRate();
        double deliveryRate = calculateDeliveryRate();
        
        double average = (collectionRate + resolutionRate + deliveryRate) / 3.0;
        return Math.round(average * 10.0) / 10.0; // 1 ondalık basamak
    }
    
    /**
     * Finansal istatistikleri hesapla
     */
    private void calculateFinancialStats(DashboardStatsResponse stats) {
        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime endOfMonth = LocalDate.now().plusMonths(1).withDayOfMonth(1).atStartOfDay();
        
        // Bu ay gelirler (ödenen aidatlar + diğer gelirler)
        // Expense tablosunda gelir/gider ayrımı category'ye göre yapılıyor
        // Gelir kategorileri: aidat, kira, diger_gelir
        BigDecimal monthlyIncome = expenseRepository.findAll().stream()
                .filter(e -> e.getCategory() != null && 
                            (e.getCategory().contains("aidat") || 
                             e.getCategory().contains("gelir") ||
                             e.getCategory().contains("income")))
                .filter(e -> e.getCreatedAt().isAfter(startOfMonth) && e.getCreatedAt().isBefore(endOfMonth))
                .map(e -> e.getAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Bu ay giderler
        BigDecimal monthlyExpense = expenseRepository.findAll().stream()
                .filter(e -> e.getCategory() != null && 
                            !(e.getCategory().contains("aidat") || 
                              e.getCategory().contains("gelir") ||
                              e.getCategory().contains("income")))
                .filter(e -> e.getCreatedAt().isAfter(startOfMonth) && e.getCreatedAt().isBefore(endOfMonth))
                .map(e -> e.getAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Toplam bakiye
        BigDecimal totalIncome = expenseRepository.findAll().stream()
                .filter(e -> e.getCategory() != null && 
                            (e.getCategory().contains("aidat") || 
                             e.getCategory().contains("gelir") ||
                             e.getCategory().contains("income")))
                .map(e -> e.getAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalExpense = expenseRepository.findAll().stream()
                .filter(e -> e.getCategory() != null && 
                            !(e.getCategory().contains("aidat") || 
                              e.getCategory().contains("gelir") ||
                              e.getCategory().contains("income")))
                .map(e -> e.getAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalBalance = totalIncome.subtract(totalExpense);
        
        // Gelir artış oranı (geçen aya göre)
        LocalDateTime startOfLastMonth = startOfMonth.minusMonths(1);
        BigDecimal lastMonthIncome = expenseRepository.findAll().stream()
                .filter(e -> e.getCategory() != null && 
                            (e.getCategory().contains("aidat") || 
                             e.getCategory().contains("gelir") ||
                             e.getCategory().contains("income")))
                .filter(e -> e.getCreatedAt().isAfter(startOfLastMonth) && e.getCreatedAt().isBefore(startOfMonth))
                .map(e -> e.getAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        Double incomeGrowth = 0.0;
        if (lastMonthIncome.compareTo(BigDecimal.ZERO) > 0) {
            incomeGrowth = monthlyIncome.subtract(lastMonthIncome)
                    .divide(lastMonthIncome, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();
        }
        
        stats.setMonthlyIncome(monthlyIncome);
        stats.setMonthlyExpense(monthlyExpense);
        stats.setTotalBalance(totalBalance);
        stats.setIncomeGrowth(Math.round(incomeGrowth * 10.0) / 10.0);
    }
    
    /**
     * Aidat istatistiklerini hesapla
     */
    private void calculateDueStats(DashboardStatsResponse stats) {
        long totalDues = dueRepository.count();
        long paidDues = dueRepository.findAll().stream()
                .filter(d -> "odendi".equals(d.getStatus()))
                .count();
        long unpaidDues = totalDues - paidDues;
        
        BigDecimal unpaidAmount = dueRepository.findAll().stream()
                .filter(d -> !"odendi".equals(d.getStatus()))
                .map(d -> d.getTotalAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        double collectionRate = calculateCollectionRate();
        
        stats.setTotalDues(totalDues);
        stats.setPaidDues(paidDues);
        stats.setUnpaidDues(unpaidDues);
        stats.setUnpaidAmount(unpaidAmount);
        stats.setCollectionRate(collectionRate);
    }
    
    /**
     * Tahsilat oranını hesapla
     */
    private double calculateCollectionRate() {
        long totalDues = dueRepository.count();
        if (totalDues == 0) return 100.0;
        
        long paidDues = dueRepository.findAll().stream()
                .filter(d -> "odendi".equals(d.getStatus()))
                .count();
        
        return Math.round((paidDues * 100.0 / totalDues) * 10.0) / 10.0;
    }
    
    /**
     * Arıza istatistiklerini hesapla
     */
    private void calculateTicketStats(DashboardStatsResponse stats) {
        long totalTickets = ticketRepository.count();
        long openTickets = ticketRepository.findAll().stream()
                .filter(t -> "acik".equals(t.getStatus()))
                .count();
        long inProgressTickets = ticketRepository.findAll().stream()
                .filter(t -> "islemde".equals(t.getStatus()))
                .count();
        long resolvedTickets = ticketRepository.findAll().stream()
                .filter(t -> "cozuldu".equals(t.getStatus()))
                .count();
        long closedTickets = ticketRepository.findAll().stream()
                .filter(t -> "kapali".equals(t.getStatus()))
                .count();
        
        double resolutionRate = calculateResolutionRate();
        
        stats.setTotalTickets(totalTickets);
        stats.setOpenTickets(openTickets);
        stats.setInProgressTickets(inProgressTickets);
        stats.setResolvedTickets(resolvedTickets);
        stats.setClosedTickets(closedTickets);
        stats.setResolutionRate(resolutionRate);
    }
    
    /**
     * Arıza çözüm oranını hesapla
     */
    private double calculateResolutionRate() {
        long totalTickets = ticketRepository.count();
        if (totalTickets == 0) return 100.0;
        
        long resolvedOrClosed = ticketRepository.findAll().stream()
                .filter(t -> "cozuldu".equals(t.getStatus()) || "kapali".equals(t.getStatus()))
                .count();
        
        return Math.round((resolvedOrClosed * 100.0 / totalTickets) * 10.0) / 10.0;
    }
    
    /**
     * Paket istatistiklerini hesapla
     */
    private void calculatePackageStats(DashboardStatsResponse stats) {
        long totalPackages = packageRepository.count();
        long waitingPackages = packageRepository.findAll().stream()
                .filter(p -> "beklemede".equals(p.getStatus()))
                .count();
        long deliveredPackages = packageRepository.findAll().stream()
                .filter(p -> "teslim_edildi".equals(p.getStatus()))
                .count();
        
        double deliveryRate = calculateDeliveryRate();
        
        stats.setTotalPackages(totalPackages);
        stats.setWaitingPackages(waitingPackages);
        stats.setDeliveredPackages(deliveredPackages);
        stats.setDeliveryRate(deliveryRate);
    }
    
    /**
     * Paket teslim oranını hesapla
     */
    private double calculateDeliveryRate() {
        long totalPackages = packageRepository.count();
        if (totalPackages == 0) return 100.0;
        
        long deliveredPackages = packageRepository.findAll().stream()
                .filter(p -> "teslim_edildi".equals(p.getStatus()))
                .count();
        
        return Math.round((deliveredPackages * 100.0 / totalPackages) * 10.0) / 10.0;
    }
    
    /**
     * Mesaj istatistiklerini hesapla
     */
    private void calculateMessageStats(DashboardStatsResponse stats) {
        long totalMessages = messageRepository.count();
        long unreadMessages = messageRepository.findAll().stream()
                .filter(m -> !m.getIsRead())
                .count();
        
        stats.setTotalMessages(totalMessages);
        stats.setUnreadMessages(unreadMessages);
    }
    
    /**
     * Duyuru istatistiklerini hesapla
     */
    private void calculateAnnouncementStats(DashboardStatsResponse stats) {
        long totalAnnouncements = announcementRepository.count();
        long activeAnnouncements = announcementRepository.findAll().stream()
                .filter(a -> a.getExpiresAt() == null || a.getExpiresAt().isAfter(LocalDateTime.now()))
                .count();
        
        stats.setTotalAnnouncements(totalAnnouncements);
        stats.setActiveAnnouncements(activeAnnouncements);
    }
    
    /**
     * Görev istatistiklerini hesapla
     */
    private void calculateTaskStats(DashboardStatsResponse stats) {
        long totalTasks = taskRepository.count();
        long completedTasks = taskRepository.findAll().stream()
                .filter(t -> "tamamlandi".equals(t.getStatus()))
                .count();
        long pendingTasks = totalTasks - completedTasks;
        
        stats.setTotalTasks(totalTasks);
        stats.setCompletedTasks(completedTasks);
        stats.setPendingTasks(pendingTasks);
    }
    
    /**
     * Bakım istatistiklerini hesapla
     */
    private void calculateMaintenanceStats(DashboardStatsResponse stats) {
        long totalEquipment = maintenanceEquipmentRepository.count();
        
        LocalDate today = LocalDate.now();
        LocalDate nextWeek = today.plusDays(7);
        
        long upcomingMaintenance = maintenanceEquipmentRepository.findAll().stream()
                .filter(m -> m.getNextMaintenanceDate() != null)
                .filter(m -> !m.getNextMaintenanceDate().isBefore(today) && 
                            !m.getNextMaintenanceDate().isAfter(nextWeek))
                .count();
        
        long overdueMaintenance = maintenanceEquipmentRepository.findAll().stream()
                .filter(m -> m.getNextMaintenanceDate() != null)
                .filter(m -> m.getNextMaintenanceDate().isBefore(today))
                .count();
        
        stats.setTotalMaintenanceEquipment(totalEquipment);
        stats.setUpcomingMaintenance(upcomingMaintenance);
        stats.setOverdueMaintenance(overdueMaintenance);
    }
    
    /**
     * Site Dashboard İstatistiklerini Getir
     * Belirli bir site için veriler gerçek database'den çekilir
     */
    @Transactional(readOnly = true)
    public DashboardStatsResponse getSiteDashboard(String siteId) {
        log.info("Calculating dashboard statistics for site: {}", siteId);
        
        DashboardStatsResponse stats = new DashboardStatsResponse();
        
        Long siteIdLong = Long.parseLong(siteId);
        
        // Site-specific istatistikler
        stats.setTotalApartments(apartmentRepository.findAll().stream()
                .filter(a -> siteId.equals(a.getSiteId()))
                .count());
        
        // Finansal İstatistikler (site-specific)
        calculateFinancialStatsBySite(stats, siteIdLong);
        
        // Aidat İstatistikleri (site-specific)
        calculateDueStatsBySite(stats, siteIdLong);
        
        // Arıza İstatistikleri (site-specific)
        calculateTicketStatsBySite(stats, siteIdLong);
        
        // Paket İstatistikleri (site-specific)
        calculatePackageStatsBySite(stats, siteIdLong);
        
        // Mesaj İstatistikleri (site-specific)
        calculateMessageStatsBySite(stats, siteIdLong);
        
        // Duyuru İstatistikleri (site-specific)
        calculateAnnouncementStatsBySite(stats, siteIdLong);
        
        // Görev İstatistikleri (site-specific)
        calculateTaskStatsBySite(stats, siteIdLong);
        
        // Bakım İstatistikleri (site-specific)
        calculateMaintenanceStatsBySite(stats, siteIdLong);
        
        log.info("Site dashboard statistics calculated successfully for site: {}", siteId);
        return stats;
    }
    
    /**
     * Site-specific finansal istatistikleri hesapla
     */
    private void calculateFinancialStatsBySite(DashboardStatsResponse stats, Long siteId) {
        String siteIdStr = siteId.toString();
        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime endOfMonth = LocalDate.now().plusMonths(1).withDayOfMonth(1).atStartOfDay();
        
        // Bu ay gelirler (site-specific) - aidat, gelir, income kategorileri
        BigDecimal monthlyIncome = expenseRepository.findAll().stream()
                .filter(e -> siteIdStr.equals(e.getSiteId()))
                .filter(e -> e.getCategory() != null && 
                            (e.getCategory().toLowerCase().contains("aidat") || 
                             e.getCategory().toLowerCase().contains("gelir") ||
                             e.getCategory().toLowerCase().contains("income")))
                .filter(e -> e.getCreatedAt().isAfter(startOfMonth) && e.getCreatedAt().isBefore(endOfMonth))
                .map(e -> e.getAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Bu ay giderler (site-specific) - diğer tüm kategoriler
        BigDecimal monthlyExpense = expenseRepository.findAll().stream()
                .filter(e -> siteIdStr.equals(e.getSiteId()))
                .filter(e -> e.getCategory() != null && 
                            !(e.getCategory().toLowerCase().contains("aidat") || 
                              e.getCategory().toLowerCase().contains("gelir") ||
                              e.getCategory().toLowerCase().contains("income")))
                .filter(e -> e.getCreatedAt().isAfter(startOfMonth) && e.getCreatedAt().isBefore(endOfMonth))
                .map(e -> e.getAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Toplam gelir (tüm zamanlar)
        BigDecimal totalIncome = expenseRepository.findAll().stream()
                .filter(e -> siteIdStr.equals(e.getSiteId()))
                .filter(e -> e.getCategory() != null && 
                            (e.getCategory().toLowerCase().contains("aidat") || 
                             e.getCategory().toLowerCase().contains("gelir") ||
                             e.getCategory().toLowerCase().contains("income")))
                .map(e -> e.getAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Toplam gider (tüm zamanlar)
        BigDecimal totalExpense = expenseRepository.findAll().stream()
                .filter(e -> siteIdStr.equals(e.getSiteId()))
                .filter(e -> e.getCategory() != null && 
                            !(e.getCategory().toLowerCase().contains("aidat") || 
                              e.getCategory().toLowerCase().contains("gelir") ||
                              e.getCategory().toLowerCase().contains("income")))
                .map(e -> e.getAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        stats.setMonthlyIncome(monthlyIncome);
        stats.setMonthlyExpense(monthlyExpense);
        stats.setTotalBalance(totalIncome.subtract(totalExpense));
        
        log.info("Financial stats for site {}: monthlyIncome={}, monthlyExpense={}, totalBalance={}", 
                siteId, monthlyIncome, monthlyExpense, totalIncome.subtract(totalExpense));
    }
    
    /**
     * Site-specific aidat istatistiklerini hesapla
     */
    private void calculateDueStatsBySite(DashboardStatsResponse stats, Long siteId) {
        // Site ID'yi String'e çevir
        String siteIdStr = siteId.toString();
        
        log.info("Calculating dues stats for site: {}", siteIdStr);
        
        // Bu siteye ait apartmentları bul
        var siteApartments = apartmentRepository.findBySiteId(siteIdStr);
        log.info("Found {} apartments for site {}", siteApartments.size(), siteIdStr);
        
        var siteApartmentIds = siteApartments.stream()
                .map(a -> a.getId())
                .toList();
        
        if (siteApartmentIds.isEmpty()) {
            // Site'de apartment yoksa 0 değerleri dön
            log.warn("No apartments found for site {}, returning zero stats", siteIdStr);
            stats.setTotalDues(0L);
            stats.setPaidDues(0L);
            stats.setUnpaidDues(0L);
            stats.setUnpaidAmount(BigDecimal.ZERO);
            stats.setCollectionRate(100.0);
            return;
        }
        
        log.info("Site {} apartment IDs: {}", siteIdStr, siteApartmentIds.subList(0, Math.min(5, siteApartmentIds.size())));
        
        // Tüm dues'ları al ve filtrele
        var allDues = dueRepository.findAll();
        log.info("Total dues in database: {}", allDues.size());
        
        var siteDues = allDues.stream()
                .filter(d -> siteApartmentIds.contains(d.getApartmentId()))
                .toList();
        
        log.info("Dues for site {} apartments: {}", siteIdStr, siteDues.size());
        
        long totalDues = siteDues.size();
        
        long paidDues = siteDues.stream()
                .filter(d -> d.getStatus() == Due.DueStatus.odendi)
                .count();
        
        long unpaidDues = siteDues.stream()
                .filter(d -> d.getStatus() == Due.DueStatus.bekliyor || 
                            d.getStatus() == Due.DueStatus.gecikmis ||
                            d.getStatus() == Due.DueStatus.kismi_odendi)
                .count();
        
        BigDecimal unpaidAmount = siteDues.stream()
                .filter(d -> d.getStatus() == Due.DueStatus.bekliyor || 
                            d.getStatus() == Due.DueStatus.gecikmis ||
                            d.getStatus() == Due.DueStatus.kismi_odendi)
                .map(d -> d.getTotalAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        double collectionRate = totalDues > 0 ? Math.round((paidDues * 100.0 / totalDues) * 10.0) / 10.0 : 100.0;
        
        stats.setTotalDues(totalDues);
        stats.setPaidDues(paidDues);
        stats.setUnpaidDues(unpaidDues);
        stats.setUnpaidAmount(unpaidAmount);
        stats.setCollectionRate(collectionRate);
        
        log.info("Site {} dues stats: total={}, paid={}, unpaid={}, amount={}", 
                siteId, totalDues, paidDues, unpaidDues, unpaidAmount);
    }
    
    /**
     * Site-specific arıza istatistiklerini hesapla
     */
    private void calculateTicketStatsBySite(DashboardStatsResponse stats, Long siteId) {
        String siteIdStr = siteId.toString();
        
        long totalTickets = ticketRepository.findAll().stream()
                .filter(t -> siteIdStr.equals(t.getSiteId()))
                .count();
        long acikTickets = ticketRepository.findAll().stream()
                .filter(t -> siteIdStr.equals(t.getSiteId()))
                .filter(t -> t.getStatus() == com.sitedefteri.entity.Ticket.TicketStatus.acik)
                .count();
        long inProgressTickets = ticketRepository.findAll().stream()
                .filter(t -> siteIdStr.equals(t.getSiteId()))
                .filter(t -> t.getStatus() == com.sitedefteri.entity.Ticket.TicketStatus.islemde)
                .count();
        long resolvedTickets = ticketRepository.findAll().stream()
                .filter(t -> siteIdStr.equals(t.getSiteId()))
                .filter(t -> t.getStatus() == com.sitedefteri.entity.Ticket.TicketStatus.cozuldu)
                .count();
        long closedTickets = ticketRepository.findAll().stream()
                .filter(t -> siteIdStr.equals(t.getSiteId()))
                .filter(t -> t.getStatus() == com.sitedefteri.entity.Ticket.TicketStatus.kapali)
                .count();
        
        // openTickets = acik + islemde (dashboard'da gösterilecek toplam açık arıza sayısı)
        long openTickets = acikTickets + inProgressTickets;
        
        double resolutionRate = totalTickets > 0 ? 
                Math.round(((resolvedTickets + closedTickets) * 100.0 / totalTickets) * 10.0) / 10.0 : 100.0;
        
        stats.setTotalTickets(totalTickets);
        stats.setOpenTickets(openTickets);
        stats.setInProgressTickets(inProgressTickets);
        stats.setResolvedTickets(resolvedTickets);
        stats.setClosedTickets(closedTickets);
        stats.setResolutionRate(resolutionRate);
        
        log.info("Site {} ticket stats: total={}, open={} (acik={} + islemde={}), resolved={}, closed={}", 
                siteId, totalTickets, openTickets, acikTickets, inProgressTickets, resolvedTickets, closedTickets);
    }
    
    /**
     * Site-specific paket istatistiklerini hesapla
     */
    private void calculatePackageStatsBySite(DashboardStatsResponse stats, Long siteId) {
        String siteIdStr = siteId.toString();
        
        long totalPackages = packageRepository.findAll().stream()
                .filter(p -> siteIdStr.equals(p.getSiteId()))
                .count();
        long waitingPackages = packageRepository.findAll().stream()
                .filter(p -> siteIdStr.equals(p.getSiteId()))
                .filter(p -> "beklemede".equals(p.getStatus()) || "waiting".equals(p.getStatus()))
                .count();
        long deliveredPackages = packageRepository.findAll().stream()
                .filter(p -> siteIdStr.equals(p.getSiteId()))
                .filter(p -> "teslim_edildi".equals(p.getStatus()) || "delivered".equals(p.getStatus()))
                .count();
        
        double deliveryRate = totalPackages > 0 ? 
                Math.round((deliveredPackages * 100.0 / totalPackages) * 10.0) / 10.0 : 100.0;
        
        stats.setTotalPackages(totalPackages);
        stats.setWaitingPackages(waitingPackages);
        stats.setDeliveredPackages(deliveredPackages);
        stats.setDeliveryRate(deliveryRate);
    }
    
    /**
     * Site-specific mesaj istatistiklerini hesapla
     */
    private void calculateMessageStatsBySite(DashboardStatsResponse stats, Long siteId) {
        String siteIdStr = siteId.toString();
        
        long totalMessages = messageRepository.findAll().stream()
                .filter(m -> siteIdStr.equals(m.getSiteId()))
                .count();
        long unreadMessages = messageRepository.findAll().stream()
                .filter(m -> siteIdStr.equals(m.getSiteId()))
                .filter(m -> !m.getIsRead())
                .count();
        
        stats.setTotalMessages(totalMessages);
        stats.setUnreadMessages(unreadMessages);
    }
    
    /**
     * Site-specific duyuru istatistiklerini hesapla
     */
    private void calculateAnnouncementStatsBySite(DashboardStatsResponse stats, Long siteId) {
        String siteIdStr = siteId.toString();
        
        long totalAnnouncements = announcementRepository.findAll().stream()
                .filter(a -> siteIdStr.equals(a.getSiteId()))
                .count();
        long activeAnnouncements = announcementRepository.findAll().stream()
                .filter(a -> siteIdStr.equals(a.getSiteId()))
                .filter(a -> a.getExpiresAt() == null || a.getExpiresAt().isAfter(LocalDateTime.now()))
                .count();
        
        stats.setTotalAnnouncements(totalAnnouncements);
        stats.setActiveAnnouncements(activeAnnouncements);
    }
    
    /**
     * Site-specific görev istatistiklerini hesapla
     */
    private void calculateTaskStatsBySite(DashboardStatsResponse stats, Long siteId) {
        String siteIdStr = siteId.toString();
        
        long totalTasks = taskRepository.findAll().stream()
                .filter(t -> siteIdStr.equals(t.getSiteId()))
                .count();
        long completedTasks = taskRepository.findAll().stream()
                .filter(t -> siteIdStr.equals(t.getSiteId()))
                .filter(t -> "tamamlandi".equals(t.getStatus()) || "completed".equals(t.getStatus()))
                .count();
        long pendingTasks = totalTasks - completedTasks;
        
        stats.setTotalTasks(totalTasks);
        stats.setCompletedTasks(completedTasks);
        stats.setPendingTasks(pendingTasks);
    }
    
    /**
     * Site-specific bakım istatistiklerini hesapla
     */
    private void calculateMaintenanceStatsBySite(DashboardStatsResponse stats, Long siteId) {
        String siteIdStr = siteId.toString();
        
        long totalEquipment = maintenanceEquipmentRepository.findAll().stream()
                .filter(m -> siteIdStr.equals(m.getSiteId()))
                .count();
        
        LocalDate today = LocalDate.now();
        LocalDate nextWeek = today.plusDays(7);
        
        long upcomingMaintenance = maintenanceEquipmentRepository.findAll().stream()
                .filter(m -> siteIdStr.equals(m.getSiteId()))
                .filter(m -> m.getNextMaintenanceDate() != null)
                .filter(m -> !m.getNextMaintenanceDate().isBefore(today) && 
                            !m.getNextMaintenanceDate().isAfter(nextWeek))
                .count();
        
        long overdueMaintenance = maintenanceEquipmentRepository.findAll().stream()
                .filter(m -> siteIdStr.equals(m.getSiteId()))
                .filter(m -> m.getNextMaintenanceDate() != null)
                .filter(m -> m.getNextMaintenanceDate().isBefore(today))
                .count();
        
        stats.setTotalMaintenanceEquipment(totalEquipment);
        stats.setUpcomingMaintenance(upcomingMaintenance);
        stats.setOverdueMaintenance(overdueMaintenance);
    }
    
    /**
     * Resident Dashboard İstatistiklerini Getir
     * Kullanıcının kendi verilerini döndürür
     */
    @Transactional(readOnly = true)
    public DashboardStatsResponse getResidentDashboard(String userId) {
        log.info("Calculating resident dashboard statistics for user: {}", userId);
        
        DashboardStatsResponse stats = new DashboardStatsResponse();
        
        // Kullanıcının sitesindeki TÜM arızaları bul (arıza listesi ile tutarlı olması için)
        long openTickets = 0;
        try {
            // Kullanıcının apartmentlarını bul
            List<String> apartmentIds = apartmentRepository.findByActiveResidency(userId)
                    .stream()
                    .map(apartment -> apartment.getId())
                    .collect(java.util.stream.Collectors.toList());
            
            if (!apartmentIds.isEmpty()) {
                // İlk apartmenttan site ID'yi al
                String firstApartmentId = apartmentIds.get(0);
                var apartment = apartmentRepository.findById(firstApartmentId);
                
                if (apartment.isPresent()) {
                    String siteId = apartment.get().getSiteId();
                    
                    // Site'deki TÜM açık/işlemdeki arızaları say (arıza listesi ile aynı mantık)
                    openTickets = ticketRepository.findAll().stream()
                            .filter(t -> siteId.equals(t.getSiteId()) && 
                                        (t.getStatus() == com.sitedefteri.entity.Ticket.TicketStatus.acik || 
                                         t.getStatus() == com.sitedefteri.entity.Ticket.TicketStatus.islemde))
                            .count();
                    
                    log.info("Found {} open tickets in site {} for user {}", openTickets, siteId, userId);
                } else {
                    log.warn("Apartment {} not found, using fallback", firstApartmentId);
                    // Fallback: kullanıcının kendi oluşturduğu arızalar
                    openTickets = ticketRepository.findAll().stream()
                            .filter(t -> userId.equals(t.getUserId()) && 
                                        (t.getStatus() == com.sitedefteri.entity.Ticket.TicketStatus.acik || 
                                         t.getStatus() == com.sitedefteri.entity.Ticket.TicketStatus.islemde))
                            .count();
                }
            } else {
                log.warn("No apartments found for user {}, checking tickets by userId", userId);
                // Fallback: kullanıcının kendi oluşturduğu arızalar
                openTickets = ticketRepository.findAll().stream()
                        .filter(t -> userId.equals(t.getUserId()) && 
                                    (t.getStatus() == com.sitedefteri.entity.Ticket.TicketStatus.acik || 
                                     t.getStatus() == com.sitedefteri.entity.Ticket.TicketStatus.islemde))
                        .count();
            }
        } catch (Exception e) {
            log.error("Error calculating tickets for user {}: {}", userId, e.getMessage());
            // Fallback: kullanıcının kendi oluşturduğu arızalar
            openTickets = ticketRepository.findAll().stream()
                    .filter(t -> userId.equals(t.getUserId()) && 
                                (t.getStatus() == com.sitedefteri.entity.Ticket.TicketStatus.acik || 
                                 t.getStatus() == com.sitedefteri.entity.Ticket.TicketStatus.islemde))
                    .count();
        }
        
        // Kullanıcının okunmamış mesajları (şimdilik 0 dön, mesajlaşma sistemi yeni)
        long unreadMessages = 0;
        
        // Kullanıcının apartmentlarını bul - DueService ile aynı mantığı kullan
        try {
            // Kullanıcının residency_history tablosunda aktif olarak kayıtlı olduğu daireleri bul
            List<String> apartmentIds = apartmentRepository.findByActiveResidency(userId)
                    .stream()
                    .map(apartment -> apartment.getId())
                    .collect(java.util.stream.Collectors.toList());
            
            if (!apartmentIds.isEmpty()) {
                log.info("Found {} apartments for user {}: {}", apartmentIds.size(), userId, apartmentIds);
                
                // Bu apartmentlara ait bekleyen aidatları bul
                var userDues = dueRepository.findByApartmentIdInOrderByDueDateDesc(apartmentIds).stream()
                        .filter(d -> d.getStatus() == Due.DueStatus.bekliyor || 
                                    d.getStatus() == Due.DueStatus.gecikmis ||
                                    d.getStatus() == Due.DueStatus.kismi_odendi)
                        .collect(java.util.stream.Collectors.toList());
                
                long unpaidDues = userDues.size();
                BigDecimal unpaidAmount = userDues.stream()
                        .map(d -> d.getTotalAmount())
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                
                stats.setUnpaidDues(unpaidDues);
                stats.setUnpaidAmount(unpaidAmount);
                
                // Bu apartmentlara ait bekleyen paketleri bul - şimdilik 0 dön
                // Çünkü paket API'si ile dashboard API'si arasında tutarsızlık var
                long waitingPackages = 0;
                
                // TODO: Paket sayma mantığını düzelt
                // Gerçek paket API'si ile aynı sonucu vermeli
                
                stats.setWaitingPackages(waitingPackages);
                
                log.info("Resident dashboard calculated: apartmentIds={}, unpaidDues={}, unpaidAmount={}, waitingPackages={}", 
                        apartmentIds, unpaidDues, unpaidAmount, waitingPackages);
            } else {
                log.warn("No active residency found for user {}", userId);
                stats.setUnpaidDues(0L);
                stats.setUnpaidAmount(BigDecimal.ZERO);
                stats.setWaitingPackages(0L);
            }
        } catch (Exception e) {
            log.error("Error calculating resident dashboard for user {}: {}", userId, e.getMessage());
            stats.setUnpaidDues(0L);
            stats.setUnpaidAmount(BigDecimal.ZERO);
            stats.setWaitingPackages(0L);
        }
        
        stats.setOpenTickets(openTickets);
        stats.setUnreadMessages(unreadMessages);
        
        // Kullanıcının görevlerini say (Security ve Cleaning için)
        try {
            long totalTasks = taskRepository.findAll().stream()
                    .filter(t -> userId.equals(t.getAssignedTo()) && !t.getIsDeleted())
                    .count();
            
            long completedTasks = taskRepository.findAll().stream()
                    .filter(t -> userId.equals(t.getAssignedTo()) && !t.getIsDeleted())
                    .filter(t -> t.getStatus() == com.sitedefteri.entity.Task.TaskStatus.tamamlandi)
                    .count();
            
            long pendingTasks = totalTasks - completedTasks;
            
            stats.setTotalTasks(totalTasks);
            stats.setCompletedTasks(completedTasks);
            stats.setPendingTasks(pendingTasks);
            
            log.info("User {} tasks: total={}, completed={}, pending={}", 
                    userId, totalTasks, completedTasks, pendingTasks);
        } catch (Exception e) {
            log.error("Error calculating tasks for user {}: {}", userId, e.getMessage());
            stats.setTotalTasks(0L);
            stats.setCompletedTasks(0L);
            stats.setPendingTasks(0L);
        }
        
        log.info("Resident dashboard calculated: openTickets={}, unreadMessages={}", 
                openTickets, unreadMessages);
        
        return stats;
    }
}
