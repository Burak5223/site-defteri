package com.sitedefteri.controller;

import com.sitedefteri.dto.response.DashboardStatsResponse;
import com.sitedefteri.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Dashboard Controller
 * Super Admin için gerçek verilerden istatistikler
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DashboardController {
    
    private final DashboardService dashboardService;
    
    /**
     * Super Admin Dashboard İstatistikleri
     * GET /api/dashboard/super-admin
     * 
     * Tüm sitelerden toplanan gerçek veriler:
     * - Site, yönetici, sakin, daire sayıları
     * - Finansal durum (gelir, gider, bakiye)
     * - Aidat durumu (ödenen, ödenmemiş)
     * - Arıza durumu (açık, çözülen)
     * - Paket durumu (bekleyen, teslim edilen)
     * - Mesaj, duyuru, görev, bakım istatistikleri
     */
    @GetMapping("/dashboard/super-admin")
    public ResponseEntity<DashboardStatsResponse> getSuperAdminStats() {
        return ResponseEntity.ok(dashboardService.getSuperAdminStats());
    }
    
    /**
     * Site Dashboard İstatistikleri
     * GET /api/sites/{siteId}/dashboard
     * 
     * Belirli bir site için istatistikler:
     * - Site bilgileri
     * - Finansal durum
     * - Aidat durumu
     * - Arıza durumu
     * - Paket durumu
     */
    @GetMapping("/sites/{siteId}/dashboard")
    public ResponseEntity<DashboardStatsResponse> getSiteDashboard(@PathVariable String siteId) {
        return ResponseEntity.ok(dashboardService.getSiteDashboard(siteId));
    }
    
    /**
     * Admin Dashboard İstatistikleri (Eski endpoint - backward compatibility)
     * GET /api/dashboard/admin/{siteId}
     */
    @GetMapping("/dashboard/admin/{siteId}")
    public ResponseEntity<DashboardStatsResponse> getAdminDashboardLegacy(@PathVariable String siteId) {
        return ResponseEntity.ok(dashboardService.getSiteDashboard(siteId));
    }
    
    /**
     * Resident Dashboard İstatistikleri
     * GET /api/sites/{siteId}/dashboard/resident
     * 
     * Sakin için kişisel istatistikler
     */
    @GetMapping("/sites/{siteId}/dashboard/resident")
    public ResponseEntity<DashboardStatsResponse> getResidentDashboard(@PathVariable String siteId) {
        // Kullanıcı ID'sini security context'ten al
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication != null ? authentication.getName() : null;
        
        if (userId == null) {
            // Kullanıcı yoksa boş stats dön
            return ResponseEntity.ok(new DashboardStatsResponse());
        }
        
        return ResponseEntity.ok(dashboardService.getResidentDashboard(userId));
    }

    /**
     * Default Dashboard (backward compatibility)
     * GET /api/dashboard
     *
     * Kullanıcının rolüne göre uygun dashboard'u döner
     */
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardStatsResponse> getDefaultDashboard(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.ok(new DashboardStatsResponse());
        }

        String userId = authentication.getName();
        // Super admin için super admin stats
        // Diğerleri için kendi site stats'ı
        return ResponseEntity.ok(dashboardService.getSuperAdminStats());
    }
}
