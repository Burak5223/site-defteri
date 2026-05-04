package com.sitedefteri.controller;

import com.sitedefteri.dto.request.CreateAnnouncementRequest;
import com.sitedefteri.dto.response.AnnouncementResponse;
import com.sitedefteri.service.AnnouncementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AnnouncementController {
    
    private final AnnouncementService announcementService;
    
    /**
     * Get all announcements (backward compatibility)
     * GET /api/announcements
     */
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'RESIDENT', 'SECURITY', 'CLEANING')")
    @GetMapping("/announcements")
    public ResponseEntity<List<AnnouncementResponse>> getAllAnnouncements(Authentication authentication) {
        // Kullanıcının site ID'sini al
        if (authentication == null) {
            return ResponseEntity.ok(List.of());
        }
        // Tüm duyuruları döndür (site filtrelemesi service'de yapılabilir)
        return ResponseEntity.ok(announcementService.getAnnouncementsBySite(null));
    }
    
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'RESIDENT', 'SECURITY', 'CLEANING')")
    @GetMapping("/sites/{siteId}/announcements")
    public ResponseEntity<List<AnnouncementResponse>> getAnnouncements(@PathVariable String siteId) {
        return ResponseEntity.ok(announcementService.getAnnouncementsBySite(siteId));
    }
    
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'RESIDENT', 'SECURITY', 'CLEANING')")
    @GetMapping("/sites/{siteId}/announcements/{announcementId}")
    public ResponseEntity<AnnouncementResponse> getAnnouncement(
            @PathVariable String siteId,
            @PathVariable String announcementId) {
        return ResponseEntity.ok(announcementService.getAnnouncementById(announcementId));
    }
    
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @PostMapping("/sites/{siteId}/announcements")
    public ResponseEntity<AnnouncementResponse> createAnnouncement(
            @PathVariable String siteId,
            @Valid @RequestBody CreateAnnouncementRequest request,
            Authentication authentication) {
        String userId = authentication.getName();
        return ResponseEntity.ok(announcementService.createAnnouncement(request, siteId, userId));
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/sites/{siteId}/announcements/{announcementId}")
    public ResponseEntity<AnnouncementResponse> updateAnnouncement(
            @PathVariable String siteId,
            @PathVariable String announcementId,
            @Valid @RequestBody CreateAnnouncementRequest request) {
        return ResponseEntity.ok(announcementService.updateAnnouncement(announcementId, request));
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/sites/{siteId}/announcements/{announcementId}")
    public ResponseEntity<Void> deleteAnnouncement(
            @PathVariable String siteId,
            @PathVariable String announcementId) {
        announcementService.deleteAnnouncement(announcementId);
        return ResponseEntity.noContent().build();
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/sites/{siteId}/announcements/{announcementId}/publish")
    public ResponseEntity<AnnouncementResponse> publishAnnouncement(
            @PathVariable String siteId,
            @PathVariable String announcementId) {
        return ResponseEntity.ok(announcementService.publishAnnouncement(announcementId));
    }
}
