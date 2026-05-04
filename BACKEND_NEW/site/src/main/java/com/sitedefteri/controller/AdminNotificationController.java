package com.sitedefteri.controller;

import com.sitedefteri.dto.request.SendNotificationRequest;
import com.sitedefteri.service.FirebaseMessagingService;
import com.sitedefteri.repository.UserFcmTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Admin Notification Controller
 * 
 * Admin panelden push notification gönderme
 */
@RestController
@RequestMapping("/api/sites/{siteId}/admin/notifications")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AdminNotificationController {
    
    private final FirebaseMessagingService messagingService;
    private final UserFcmTokenRepository fcmTokenRepository;
    
    /**
     * Tek kullanıcıya bildirim gönder
     * POST /api/sites/{siteId}/admin/notifications/send-to-user
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/send-to-user")
    public ResponseEntity<Map<String, String>> sendToUser(
            @PathVariable String siteId,
            @RequestBody SendNotificationRequest request) {
        
        log.info("Admin sending notification to user: {}", request.getUserId());
        
        try {
            String fcmToken = fcmTokenRepository
                .findByUserId(request.getUserId())
                .map(t -> t.getFcmToken())
                .orElseThrow(() -> new RuntimeException("FCM token not found for user"));
            
            messagingService.sendToUser(
                fcmToken,
                request.getTitle(),
                request.getBody(),
                request.getData()
            );
            
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Notification sent successfully"
            ));
            
        } catch (Exception e) {
            log.error("Failed to send notification: {}", e.getMessage());
            return ResponseEntity.ok(Map.of(
                "status", "error",
                "message", e.getMessage()
            ));
        }
    }
    
    /**
     * Tüm kullanıcılara bildirim gönder (Topic)
     * POST /api/sites/{siteId}/admin/notifications/send-to-all
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/send-to-all")
    public ResponseEntity<Map<String, String>> sendToAll(
            @PathVariable String siteId,
            @RequestBody SendNotificationRequest request) {
        
        log.info("Admin sending notification to all users");
        
        try {
            messagingService.sendToTopic(
                "site-duyuru",
                request.getTitle(),
                request.getBody()
            );
            
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Notification sent to all users"
            ));
            
        } catch (Exception e) {
            log.error("Failed to send notification: {}", e.getMessage());
            return ResponseEntity.ok(Map.of(
                "status", "error",
                "message", e.getMessage()
            ));
        }
    }
    
    /**
     * Belirli bir bloğa bildirim gönder
     * POST /api/sites/{siteId}/admin/notifications/send-to-block/{blockId}
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/send-to-block/{blockId}")
    public ResponseEntity<Map<String, String>> sendToBlock(
            @PathVariable String siteId,
            @PathVariable String blockId,
            @RequestBody SendNotificationRequest request) {
        
        log.info("Admin sending notification to block: {}", blockId);
        
        try {
            // Bloktaki tüm kullanıcıların token'larını al
            List<String> fcmTokens = fcmTokenRepository
                .findAll()
                .stream()
                .map(t -> t.getFcmToken())
                .collect(Collectors.toList());
            
            if (fcmTokens.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                    "status", "warning",
                    "message", "No FCM tokens found for block"
                ));
            }
            
            messagingService.sendToMultipleUsers(
                fcmTokens,
                request.getTitle(),
                request.getBody()
            );
            
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Notification sent to " + fcmTokens.size() + " users",
                "sentTo", String.valueOf(fcmTokens.size())
            ));
            
        } catch (Exception e) {
            log.error("Failed to send notification: {}", e.getMessage());
            return ResponseEntity.ok(Map.of(
                "status", "error",
                "message", e.getMessage()
            ));
        }
    }
    
    /**
     * Test bildirimi gönder
     * POST /api/sites/{siteId}/admin/notifications/test
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/test")
    public ResponseEntity<Map<String, String>> sendTestNotification(@PathVariable String siteId) {
        log.info("Sending test notification");
        
        messagingService.sendToTopic(
            "site-duyuru",
            "Test Bildirim",
            "Bu bir test bildirimidir. Sistem çalışıyor!"
        );
        
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "message", "Test notification sent"
        ));
    }
}
