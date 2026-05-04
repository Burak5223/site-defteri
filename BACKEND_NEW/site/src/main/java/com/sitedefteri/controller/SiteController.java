package com.sitedefteri.controller;

import com.sitedefteri.dto.request.CreateSiteRequest;
import com.sitedefteri.dto.request.UpdateSiteRequest;
import com.sitedefteri.dto.response.SiteResponse;
import com.sitedefteri.service.SiteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Site Controller
 * Site yönetimi için endpoint'ler
 */
@RestController
@RequestMapping("/api/sites")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SiteController {
    
    private final SiteService siteService;
    
    /**
     * Tüm siteleri getir
     * GET /api/sites
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @GetMapping
    public ResponseEntity<List<SiteResponse>> getAllSites() {
        return ResponseEntity.ok(siteService.getAllSites());
    }
    
    /**
     * Site detayını getir
     * GET /api/sites/{id}
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'RESIDENT', 'SECURITY', 'CLEANING')")
    @GetMapping("/{id}")
    public ResponseEntity<SiteResponse> getSiteById(@PathVariable String id) {
        return ResponseEntity.ok(siteService.getSiteById(id));
    }
    
    /**
     * Yeni site oluştur
     * POST /api/sites
     */
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @PostMapping
    public ResponseEntity<SiteResponse> createSite(@Valid @RequestBody CreateSiteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(siteService.createSite(request));
    }
    
    /**
     * Site güncelle
     * PUT /api/sites/{id}
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<SiteResponse> updateSite(
            @PathVariable String id,
            @Valid @RequestBody UpdateSiteRequest request) {
        return ResponseEntity.ok(siteService.updateSite(id, request));
    }
    
    /**
     * Site sil
     * DELETE /api/sites/{id}
     */
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteSite(@PathVariable String id) {
        siteService.deleteSite(id);
        return ResponseEntity.ok(Map.of("message", "Site başarıyla silindi"));
    }
    
    /**
     * Site ayarlarını getir
     * GET /api/sites/{id}/settings
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @GetMapping("/{id}/settings")
    public ResponseEntity<Map<String, Object>> getSiteSettings(@PathVariable String id) {
        return ResponseEntity.ok(siteService.getSiteSettings(id));
    }
    
    /**
     * Site ayarlarını güncelle
     * PUT /api/sites/{id}/settings
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @PutMapping("/{id}/settings")
    public ResponseEntity<Map<String, Object>> updateSiteSettings(
            @PathVariable String id,
            @RequestBody Map<String, Object> settings) {
        return ResponseEntity.ok(siteService.updateSiteSettings(id, settings));
    }
}
