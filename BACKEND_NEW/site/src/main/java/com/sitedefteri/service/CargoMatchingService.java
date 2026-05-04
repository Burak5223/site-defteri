package com.sitedefteri.service;

import com.sitedefteri.dto.cargo.CargoFormData;
import com.sitedefteri.dto.cargo.MatchingResult;
import com.sitedefteri.entity.ResidentCargoNotification;
import com.sitedefteri.entity.User;
import com.sitedefteri.repository.ResidentCargoNotificationRepository;
import com.sitedefteri.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service for matching cargo with resident notifications
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class CargoMatchingService {

    private final ResidentCargoNotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final AIParserService aiParserService;

    /**
     * Match cargo with pending resident notification
     * Returns matching result with resident info if found
     * Task 14.3: Structured logging
     */
    @Transactional
    public MatchingResult matchWithResidentNotification(CargoFormData formData, String siteId) {
        String operation = "matchWithResidentNotification";
        
        try {
            // Normalize full name for matching
            String normalizedName = aiParserService.normalizeFullName(formData.getFullName());
            
            log.info("[{}] [INFO] [CargoMatchingService] [{}] [siteId={}] Starting match, normalizedName={}", 
                     LocalDateTime.now(), operation, siteId, normalizedName);

            // Find pending notifications with matching name
            List<ResidentCargoNotification> pendingNotifications = 
                notificationRepository.findPendingByNormalizedName(siteId, normalizedName);

            if (pendingNotifications.isEmpty()) {
                log.info("[{}] [INFO] [CargoMatchingService] [{}] [siteId={}] No match found for: {}", 
                         LocalDateTime.now(), operation, siteId, normalizedName);
                return MatchingResult.noMatch("Eşleşen bildirim bulunamadı");
            }

            // Take the most recent notification (already ordered by createdAt DESC)
            ResidentCargoNotification notification = pendingNotifications.get(0);
            
            log.info("[{}] [INFO] [CargoMatchingService] [{}] [siteId={}] Match found, notificationId={}, residentId={}", 
                     LocalDateTime.now(), operation, siteId, notification.getId(), notification.getResidentId());

            // Get resident user info
            User resident = userRepository.findById(notification.getResidentId())
                .orElseThrow(() -> new RuntimeException("Sakin bulunamadı"));

            // Update notification status
            notification.setStatus("matched");
            notification.setMatchedAt(LocalDateTime.now());
            notificationRepository.save(notification);

            log.info("[{}] [INFO] [CargoMatchingService] [{}] [siteId={}] Notification marked as matched, notificationId={}", 
                     LocalDateTime.now(), operation, siteId, notification.getId());

            // Return success result
            return MatchingResult.success(
                notification.getId(),
                resident.getId(),
                notification.getApartmentId(),
                resident.getUserQrToken(),
                "Kargo sakinle eşleştirildi: " + formData.getFullName()
            );

        } catch (Exception e) {
            log.error("[{}] [ERROR] [CargoMatchingService] [{}] [siteId={}] Matching failed, error={}", 
                      LocalDateTime.now(), operation, siteId, e.getMessage());
            return MatchingResult.noMatch("Eşleştirme sırasında hata oluştu: " + e.getMessage());
        }
    }

    /**
     * Create a new resident notification ("Kargom Var")
     * Task 14.3: Structured logging
     */
    @Transactional
    public ResidentCargoNotification createResidentNotification(
            String residentId, 
            String siteId, 
            String apartmentId,
            String fullName,
            String cargoCompany,
            String expectedDate) {
        
        String operation = "createResidentNotification";
        
        log.info("[{}] [INFO] [CargoMatchingService] [{}] [siteId={}] [residentId={}] Creating notification, fullName={}", 
                 LocalDateTime.now(), operation, siteId, residentId, fullName);
        
        ResidentCargoNotification notification = new ResidentCargoNotification();
        notification.setResidentId(residentId);
        notification.setSiteId(siteId);
        notification.setApartmentId(apartmentId);
        notification.setFullName(fullName);
        notification.setFullNameNormalized(aiParserService.normalizeFullName(fullName));
        notification.setCargoCompany(cargoCompany);
        notification.setStatus("pending_match");
        
        // Convert expectedDate string to LocalDate if provided
        if (expectedDate != null && !expectedDate.isEmpty()) {
            try {
                notification.setExpectedDate(java.time.LocalDate.parse(expectedDate));
            } catch (Exception e) {
                log.warn("[{}] [WARN] [CargoMatchingService] [{}] Invalid date format: {}", 
                         LocalDateTime.now(), operation, expectedDate);
            }
        }

        ResidentCargoNotification saved = notificationRepository.save(notification);
        
        log.info("[{}] [INFO] [CargoMatchingService] [{}] [siteId={}] [residentId={}] Notification created, notificationId={}", 
                 LocalDateTime.now(), operation, siteId, residentId, saved.getId());

        return saved;
    }

    /**
     * Get all notifications for a resident
     */
    public List<ResidentCargoNotification> getResidentNotifications(String residentId) {
        return notificationRepository.findByResidentIdOrderByCreatedAtDesc(residentId);
    }

    /**
     * Get pending notifications for a site
     */
    public List<ResidentCargoNotification> getPendingNotifications(String siteId) {
        return notificationRepository.findBySiteIdAndStatusOrderByCreatedAtDesc(siteId, "pending_match");
    }
}
