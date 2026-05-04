package com.sitedefteri.controller;

import com.sitedefteri.dto.response.NotificationResponse;
import com.sitedefteri.entity.UserFcmToken;
import com.sitedefteri.repository.UserFcmTokenRepository;
import com.sitedefteri.security.JwtTokenProvider;
import com.sitedefteri.service.FirebaseMessagingService;
import com.sitedefteri.service.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class NotificationController {
    
    private final NotificationService notificationService;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserFcmTokenRepository fcmTokenRepository;
    private final FirebaseMessagingService firebaseMessagingService;
    
    /**
     * Get all notifications for current user
     * GET /api/sites/{siteId}/notifications
     */
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'RESIDENT', 'SECURITY', 'CLEANING')")
    @GetMapping("/sites/{siteId}/notifications")
    public ResponseEntity<List<NotificationResponse>> getNotifications(
            @PathVariable String siteId,
            HttpServletRequest httpRequest,
            @RequestParam(required = false) Boolean unreadOnly) {
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        
        if (Boolean.TRUE.equals(unreadOnly)) {
            return ResponseEntity.ok(notificationService.getUnreadNotifications(userId));
        }
        
        return ResponseEntity.ok(notificationService.getNotificationsByUser(userId));
    }
    
    /**
     * Get all notifications (simple endpoint)
     * GET /api/notifications
     */
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'RESIDENT', 'SECURITY', 'CLEANING')")
    @GetMapping("/notifications")
    public ResponseEntity<List<NotificationResponse>> getAllNotifications(HttpServletRequest httpRequest) {
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        return ResponseEntity.ok(notificationService.getNotificationsByUser(userId));
    }
    
    /**
     * Get notifications for specific user (mobile app endpoint)
     * GET /api/users/{userId}/notifications
     */
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'RESIDENT', 'SECURITY', 'CLEANING')")
    @GetMapping("/users/{userId}/notifications")
    public ResponseEntity<List<NotificationResponse>> getUserNotifications(
            @PathVariable String userId,
            HttpServletRequest httpRequest) {
        // Verify user can only access their own notifications (unless admin)
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String requestingUserId = jwtTokenProvider.getUserIdFromToken(token);
        String role = jwtTokenProvider.getRoleFromToken(token);
        
        // Allow if requesting own notifications or if admin/super_admin
        if (!requestingUserId.equals(userId) && 
            !role.equals("ROLE_ADMIN") && 
            !role.equals("ROLE_SUPER_ADMIN")) {
            return ResponseEntity.status(403).build();
        }
        
        return ResponseEntity.ok(notificationService.getNotificationsByUser(userId));
    }
    
    /**
     * Get unread notification count
     * GET /api/sites/{siteId}/notifications/unread-count
     */
    @GetMapping("/sites/{siteId}/notifications/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @PathVariable String siteId,
            HttpServletRequest httpRequest) {
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(Map.of("count", count));
    }
    
    /**
     * Mark notification as read
     * PUT /api/sites/{siteId}/notifications/{notificationId}/read
     */
    @PutMapping("/sites/{siteId}/notifications/{notificationId}/read")
    public ResponseEntity<NotificationResponse> markAsRead(
            @PathVariable String siteId,
            @PathVariable String notificationId,
            HttpServletRequest httpRequest) {
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        
        return ResponseEntity.ok(notificationService.markAsRead(notificationId));
    }
    
    /**
     * Delete notification
     * DELETE /api/sites/{siteId}/notifications/{notificationId}
     */
    @DeleteMapping("/sites/{siteId}/notifications/{notificationId}")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable String siteId,
            @PathVariable String notificationId,
            HttpServletRequest httpRequest) {
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        
        notificationService.deleteNotification(notificationId);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Register FCM token for push notifications
     * POST /api/fcm/register
     */
    @PostMapping("/fcm/register")
    public ResponseEntity<Map<String, String>> registerFcmToken(
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        String fcmToken = request.get("fcmToken");
        
        if (fcmToken == null || fcmToken.isEmpty()) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "FCM token is required"));
        }
        
        // Check if token already exists
        UserFcmToken existingToken = fcmTokenRepository.findByUserId(userId).orElse(null);
        
        if (existingToken != null) {
            // Update existing token
            existingToken.setFcmToken(fcmToken);
            existingToken.setUpdatedAt(LocalDateTime.now());
            fcmTokenRepository.save(existingToken);
        } else {
            // Create new token
            UserFcmToken newToken = new UserFcmToken();
            newToken.setUserId(userId);
            newToken.setFcmToken(fcmToken);
            newToken.setCreatedAt(LocalDateTime.now());
            newToken.setUpdatedAt(LocalDateTime.now());
            fcmTokenRepository.save(newToken);
        }
        
        return ResponseEntity.ok(Map.of(
            "message", "FCM token registered successfully",
            "userId", userId
        ));
    }
    
    /**
     * Send test push notification
     * POST /api/fcm/test
     */
    @PostMapping("/fcm/test")
    public ResponseEntity<Map<String, String>> sendTestNotification(
            HttpServletRequest httpRequest) {
        String token = jwtTokenProvider.getTokenFromRequest(httpRequest);
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        
        // Get FCM token
        UserFcmToken userToken = fcmTokenRepository.findByUserId(userId).orElse(null);
        
        if (userToken == null) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "No FCM token registered for this user"));
        }
        
        // Send test notification
        try {
            firebaseMessagingService.sendToUser(
                userToken.getFcmToken(),
                "Test Bildirimi 🔔",
                "Bu bir test bildirimidir. Sistem çalışıyor!",
                Map.of("type", "TEST", "timestamp", String.valueOf(System.currentTimeMillis()))
            );
            
            return ResponseEntity.ok(Map.of(
                "message", "Test notification sent successfully",
                "userId", userId
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to send notification: " + e.getMessage()));
        }
    }
}
