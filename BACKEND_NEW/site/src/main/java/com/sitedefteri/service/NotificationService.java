package com.sitedefteri.service;

import com.sitedefteri.dto.response.NotificationResponse;
import com.sitedefteri.entity.Notification;
import com.sitedefteri.entity.Package;
import com.sitedefteri.entity.User;
import com.sitedefteri.exception.ResourceNotFoundException;
import com.sitedefteri.repository.NotificationRepository;
import com.sitedefteri.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Bildirim Servisi
 * Paket, ödeme, duyuru vb. için otomatik bildirimler gönderir
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {
    
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    // private final MessageService messageService; // Temporarily disabled
    
    /**
     * Get all notifications for a user
     */
    public List<NotificationResponse> getNotificationsByUser(String userId) {
        log.info("Fetching notifications for user: {}", userId);
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Get unread notifications for a user
     */
    public List<NotificationResponse> getUnreadNotifications(String userId) {
        log.info("Fetching unread notifications for user: {}", userId);
        return notificationRepository.findByUserIdAndIsReadOrderByCreatedAtDesc(userId, false).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Get unread notification count
     */
    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndIsRead(userId, false);
    }
    
    /**
     * Mark notification as read
     */
    @Transactional
    public NotificationResponse markAsRead(String notificationId) {
        log.info("Marking notification as read: {}", notificationId);
        
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Bildirim", "id", notificationId));
        
        notification.setIsRead(true);
        notification.setReadAt(LocalDateTime.now());
        
        Notification updated = notificationRepository.save(notification);
        log.info("Notification marked as read: {}", notificationId);
        
        return toResponse(updated);
    }
    
    /**
     * Delete notification
     */
    @Transactional
    public void deleteNotification(String notificationId) {
        log.info("Deleting notification: {}", notificationId);
        
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Bildirim", "id", notificationId));
        
        notificationRepository.delete(notification);
        log.info("Notification deleted: {}", notificationId);
    }
    
    /**
     * Create notification
     */
    @Transactional
    public NotificationResponse createNotification(String userId, String title, String body, 
                                                   String type, String relatedType, String relatedId) {
        log.info("Creating notification for user: {}", userId);
        
        Notification notification = new Notification();
        notification.setId(UUID.randomUUID().toString());
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setBody(body);
        notification.setType(type); // Set legacy type field
        notification.setNotificationType(type);
        notification.setRelatedType(relatedType);
        notification.setRelatedId(relatedId);
        notification.setIsRead(false);
        
        Notification saved = notificationRepository.save(notification);
        log.info("Notification created: {}", saved.getId());
        
        return toResponse(saved);
    }
    
    /**
     * Paket geldiğinde sakine bildirim gönder
     * "Paketiniz site güvenliğine teslim edilmiştir"
     * Ayrı transaction'da çalışır, hata olsa bile ana işlem devam eder
     */
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void notifyPackageReceived(Package pkg) {
        try {
            log.info("Sending package received notification for package: {}", pkg.getId());
            
            // Daire sakinlerini bul
            List<User> residents = userRepository.findByApartmentId(pkg.getApartmentId());
            
            if (residents.isEmpty()) {
                log.warn("No residents found for apartment: {}", pkg.getApartmentId());
                return;
            }
            
            // Bildirim mesajı oluştur
            String message = createPackageReceivedMessage(pkg);
            
            // Her sakine bildirim gönder
            for (User resident : residents) {
                try {
                    createNotification(
                        resident.getId(),
                        "Yeni Paket Geldi",
                        message,
                        "info",
                        "package",
                        pkg.getId()
                    );
                    sendNotificationToUser(resident.getId(), message, "PACKAGE", pkg.getId());
                    log.info("Notification sent to user: {}", resident.getId());
                } catch (Exception e) {
                    log.error("Failed to send notification to user: {}", resident.getId(), e);
                }
            }
            
            // Paket bildirim zamanını güncelle
            pkg.setNotifiedAt(LocalDateTime.now());
            
        } catch (Exception e) {
            log.error("Failed to send package received notifications", e);
        }
    }
    
    /**
     * Paket teslim edildiğinde sakine bildirim gönder
     * "Paketiniz teslim edilmiştir"
     * Ayrı transaction'da çalışır, hata olsa bile ana işlem devam eder
     */
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void notifyPackageDelivered(Package pkg) {
        try {
            log.info("Sending package delivered notification for package: {}", pkg.getId());
            
            // Daire sakinlerini bul
            List<User> residents = userRepository.findByApartmentId(pkg.getApartmentId());
            
            if (residents.isEmpty()) {
                log.warn("No residents found for apartment: {}", pkg.getApartmentId());
                return;
            }
            
            // Bildirim mesajı oluştur
            String message = createPackageDeliveredMessage(pkg);
            
            // Her sakine bildirim gönder
            for (User resident : residents) {
                try {
                    sendNotificationToUser(resident.getId(), message, "PACKAGE", pkg.getId());
                    log.info("Delivery notification sent to user: {}", resident.getId());
                } catch (Exception e) {
                    log.error("Failed to send delivery notification to user: {}", resident.getId(), e);
                }
            }
            
        } catch (Exception e) {
            log.error("Failed to send package delivered notifications", e);
        }
    }
    
    /**
     * Paket teslim onayı beklerken sakine bildirim gönder
     * "Paketiniz güvenlik tarafından teslim edildi, lütfen onaylayın"
     * Ayrı transaction'da çalışır, hata olsa bile ana işlem devam eder
     */
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void notifyPackageAwaitingConfirmation(Package pkg) {
        try {
            log.info("Sending package awaiting confirmation notification for package: {}", pkg.getId());
            
            // Daire sakinlerini bul
            List<User> residents = userRepository.findByApartmentId(pkg.getApartmentId());
            
            if (residents.isEmpty()) {
                log.warn("No residents found for apartment: {}", pkg.getApartmentId());
                return;
            }
            
            // Bildirim mesajı oluştur
            String message = createPackageAwaitingConfirmationMessage(pkg);
            
            // Her sakine bildirim gönder
            for (User resident : residents) {
                try {
                    createNotification(
                        resident.getId(),
                        "Paket Teslim Onayı Bekleniyor",
                        message,
                        "warning",
                        "package",
                        pkg.getId()
                    );
                    sendNotificationToUser(resident.getId(), message, "PACKAGE_CONFIRMATION", pkg.getId());
                    log.info("Confirmation notification sent to user: {}", resident.getId());
                } catch (Exception e) {
                    log.error("Failed to send confirmation notification to user: {}", resident.getId(), e);
                }
            }
            
        } catch (Exception e) {
            log.error("Failed to send package awaiting confirmation notifications", e);
        }
    }
    
    /**
     * Paket geldiğinde mesaj içeriği oluştur
     */
    private String createPackageReceivedMessage(Package pkg) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");
        String dateTime = pkg.getRecordedAt().format(formatter);
        
        StringBuilder message = new StringBuilder();
        message.append("📦 Paket Bildirimi\n\n");
        message.append("Paketiniz site güvenliğine teslim edilmiştir.\n\n");
        message.append("Detaylar:\n");
        message.append("• Kargo Firması: ").append(pkg.getCourierName()).append("\n");
        
        if (pkg.getTrackingMasked() != null) {
            message.append("• Takip No: ").append(pkg.getTrackingMasked()).append("\n");
        }
        
        message.append("• Tarih: ").append(dateTime).append("\n");
        message.append("• Durum: Güvenlikte Bekliyor\n\n");
        message.append("Paketinizi güvenlikten teslim alabilirsiniz.");
        
        return message.toString();
    }
    
    /**
     * Paket teslim edildiğinde mesaj içeriği oluştur
     */
    private String createPackageDeliveredMessage(Package pkg) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");
        String dateTime = pkg.getDeliveredAt().format(formatter);
        
        StringBuilder message = new StringBuilder();
        message.append("✅ Paket Teslim Bildirimi\n\n");
        message.append("Paketiniz teslim edilmiştir.\n\n");
        message.append("Detaylar:\n");
        message.append("• Kargo Firması: ").append(pkg.getCourierName()).append("\n");
        
        if (pkg.getTrackingMasked() != null) {
            message.append("• Takip No: ").append(pkg.getTrackingMasked()).append("\n");
        }
        
        message.append("• Teslim Tarihi: ").append(dateTime).append("\n");
        message.append("• Teslim Eden: Site Güvenliği\n");
        
        return message.toString();
    }
    
    /**
     * Paket teslim onayı beklerken mesaj içeriği oluştur
     */
    private String createPackageAwaitingConfirmationMessage(Package pkg) {
        StringBuilder message = new StringBuilder();
        message.append("⏳ Paket Teslim Onayı\n\n");
        message.append("Güvenlik görevlisi paketinizi teslim etmek istiyor.\n\n");
        message.append("Detaylar:\n");
        message.append("• Kargo Firması: ").append(pkg.getCourierName()).append("\n");
        
        if (pkg.getTrackingMasked() != null) {
            message.append("• Takip No: ").append(pkg.getTrackingMasked()).append("\n");
        }
        
        message.append("\nLütfen paketinizi aldığınızı onaylayın.");
        
        return message.toString();
    }
    
    /**
     * Sakin "Kargom Var" bildirimi gönderdiğinde güvenliğe bildirim gönder
     * "Yeni kargo talebi: [Sakin Adı] - [Daire No]"
     * Ayrı transaction'da çalışır, hata olsa bile ana işlem devam eder
     */
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void notifySecurityAboutCargoRequest(Package pkg, String residentName) {
        try {
            log.info("Sending cargo request notification to security for package: {}", pkg.getId());
            
            // Site güvenlik görevlilerini bul
            List<User> securityUsers = userRepository.findBySiteIdAndRole(pkg.getSiteId(), "ROLE_SECURITY");
            
            if (securityUsers.isEmpty()) {
                log.warn("No security users found for site: {}", pkg.getSiteId());
                return;
            }
            
            // Bildirim mesajı oluştur
            String message = createCargoRequestMessage(pkg, residentName);
            
            // Her güvenlik görevlisine bildirim gönder
            for (User security : securityUsers) {
                try {
                    createNotification(
                        security.getId(),
                        "Yeni Kargo Talebi",
                        message,
                        "info",
                        "package_request",
                        pkg.getId()
                    );
                    sendNotificationToUser(security.getId(), message, "PACKAGE_REQUEST", pkg.getId());
                    log.info("Cargo request notification sent to security: {}", security.getId());
                } catch (Exception e) {
                    log.error("Failed to send cargo request notification to security: {}", security.getId(), e);
                }
            }
            
        } catch (Exception e) {
            log.error("Failed to send cargo request notifications to security", e);
        }
    }
    
    /**
     * Kargo talebi mesaj içeriği oluştur
     */
    private String createCargoRequestMessage(Package pkg, String residentName) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");
        String dateTime = pkg.getRecordedAt().format(formatter);
        
        StringBuilder message = new StringBuilder();
        message.append("📦 Yeni Kargo Talebi\n\n");
        message.append("Bir sakin kargo beklediğini bildirdi.\n\n");
        message.append("Detaylar:\n");
        message.append("• Sakin: ").append(residentName).append("\n");
        
        // Get apartment info
        try {
            // Apartment number will be shown in the package list
            message.append("• Daire: ").append(pkg.getApartmentId()).append("\n");
        } catch (Exception e) {
            log.warn("Could not get apartment info for message");
        }
        
        if (pkg.getCourierName() != null && !pkg.getCourierName().isEmpty()) {
            message.append("• Kargo Şirketi: ").append(pkg.getCourierName()).append("\n");
        }
        
        if (pkg.getNotes() != null && !pkg.getNotes().isEmpty()) {
            message.append("• Not: ").append(pkg.getNotes()).append("\n");
        }
        
        message.append("• Talep Tarihi: ").append(dateTime).append("\n\n");
        message.append("Kargo geldiğinde lütfen kaydedin.");
        
        return message.toString();
    }
    
    /**
     * Kullanıcıya bildirim gönder (mesaj sistemi üzerinden)
     */
    private void sendNotificationToUser(String userId, String message, String relatedType, String relatedId) {
        try {
            // Sistem mesajı olarak gönder
            // messageService.createSystemMessage(userId, message, relatedType, relatedId); // Temporarily disabled
            log.info("Notification would be sent to user: {} - {}", userId, message);
        } catch (Exception e) {
            log.error("Failed to send notification message to user: {}", userId, e);
            throw e;
        }
    }
    
    /**
     * Ödeme onaylandığında bildirim gönder
     */
    @Transactional
    public void notifyPaymentApproved(String userId, String paymentId, String amount) {
        try {
            String message = String.format(
                "✅ Ödeme Onayı\n\n" +
                "Ödemeniz onaylanmıştır.\n\n" +
                "Tutar: %s TL\n" +
                "Durum: Onaylandı\n\n" +
                "Teşekkür ederiz.",
                amount
            );
            
            sendNotificationToUser(userId, message, "PAYMENT", paymentId);
            log.info("Payment approved notification sent to user: {}", userId);
        } catch (Exception e) {
            log.error("Failed to send payment notification", e);
        }
    }
    
    /**
     * Yeni duyuru yayınlandığında bildirim gönder
     */
    @Transactional
    public void notifyNewAnnouncement(String siteId, String announcementId, String title) {
        try {
            String message = String.format(
                "📢 Yeni Duyuru\n\n" +
                "%s\n\n" +
                "Detaylar için duyurular sayfasını ziyaret edin.",
                title
            );
            
            // Site sakinlerine bildirim gönder
            List<User> residents = userRepository.findBySiteId(siteId);
            for (User resident : residents) {
                sendNotificationToUser(resident.getId(), message, "ANNOUNCEMENT", announcementId);
            }
            
            log.info("Announcement notification sent to {} users", residents.size());
        } catch (Exception e) {
            log.error("Failed to send announcement notification", e);
        }
    }
    
    /**
     * Aidat hatırlatması gönder
     */
    @Transactional
    public void notifyDueReminder(String userId, String dueId, String amount, String dueDate) {
        try {
            String message = String.format(
                "💰 Aidat Hatırlatması\n\n" +
                "Ödenmemiş aidatınız bulunmaktadır.\n\n" +
                "Tutar: %s TL\n" +
                "Son Ödeme Tarihi: %s\n\n" +
                "Lütfen ödemenizi zamanında yapınız.",
                amount, dueDate
            );
            
            sendNotificationToUser(userId, message, "DUE", dueId);
            log.info("Due reminder sent to user: {}", userId);
        } catch (Exception e) {
            log.error("Failed to send due reminder", e);
        }
    }
    
    /**
     * AI Cargo eşleştiğinde sakine bildirim gönder (Task 14.2)
     * "Kargonuz geldi ve size atandı"
     * Ayrı transaction'da çalışır, hata olsa bile ana işlem devam eder
     */
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void notifyCargoMatched(Package pkg, String residentId) {
        try {
            log.info("Sending cargo matched notification for package: {} to resident: {}", pkg.getId(), residentId);
            
            // Bildirim mesajı oluştur
            String message = createCargoMatchedMessage(pkg);
            
            // Sakine bildirim gönder
            try {
                createNotification(
                    residentId,
                    "Kargonuz Geldi",
                    message,
                    "success",
                    "package",
                    pkg.getId()
                );
                sendNotificationToUser(residentId, message, "CARGO_MATCHED", pkg.getId());
                log.info("Cargo matched notification sent to resident: {}", residentId);
            } catch (Exception e) {
                log.error("Failed to send cargo matched notification to resident: {}", residentId, e);
            }
            
            // Paket bildirim zamanını güncelle
            pkg.setNotifiedAt(LocalDateTime.now());
            
        } catch (Exception e) {
            log.error("Failed to send cargo matched notification", e);
        }
    }
    
    /**
     * Kargo eşleştiğinde mesaj içeriği oluştur (Task 14.2)
     */
    private String createCargoMatchedMessage(Package pkg) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");
        String dateTime = pkg.getRecordedAt().format(formatter);
        
        StringBuilder message = new StringBuilder();
        message.append("✅ Kargonuz Geldi ve Size Atandı\n\n");
        message.append("AI sistemi tarafından kargonuz otomatik olarak size eşleştirilmiştir.\n\n");
        message.append("Detaylar:\n");
        message.append("• Kargo Firması: ").append(pkg.getCourierName()).append("\n");
        
        if (pkg.getTrackingMasked() != null) {
            message.append("• Takip No: ").append(pkg.getTrackingMasked()).append("\n");
        }
        
        message.append("• Tarih: ").append(dateTime).append("\n");
        message.append("• Durum: Size Atandı\n\n");
        message.append("Paketinizi güvenlikten teslim alabilirsiniz.");
        
        return message.toString();
    }
    
    /**
     * Telegram OTP bildirimi gönder
     */
    @Transactional
    public void sendTelegramOtpNotification(String userId, String title, String body, String telegramBotLink) {
        try {
            log.info("Sending Telegram OTP notification to user: {}", userId);
            
            // Create notification in database
            Notification notification = new Notification();
            notification.setId(UUID.randomUUID().toString());
            notification.setUserId(userId);
            notification.setTitle(title);
            notification.setBody(body);
            notification.setType("telegram_otp");
            notification.setNotificationType("telegram_otp");
            notification.setRelatedType("telegram");
            notification.setRelatedId("otp");
            notification.setActionUrl(telegramBotLink);
            notification.setIsRead(false);
            
            notificationRepository.save(notification);
            
            // TODO: Send push notification via Firebase
            // For now, just log it
            log.info("Telegram OTP notification created for user: {}, link: {}", userId, telegramBotLink);
            
        } catch (Exception e) {
            log.error("Failed to send Telegram OTP notification to user: {}", userId, e);
            throw e;
        }
    }
    
    /**
     * Convert entity to response
     */
    private NotificationResponse toResponse(Notification notification) {
        NotificationResponse response = new NotificationResponse();
        response.setId(notification.getId());
        response.setUserId(notification.getUserId());
        response.setSiteId(notification.getSiteId());
        response.setTitle(notification.getTitle());
        response.setBody(notification.getBody());
        response.setNotificationType(notification.getNotificationType());
        response.setRelatedType(notification.getRelatedType());
        response.setRelatedId(notification.getRelatedId());
        response.setIsRead(notification.getIsRead());
        response.setReadAt(notification.getReadAt());
        response.setActionUrl(notification.getActionUrl());
        response.setCreatedAt(notification.getCreatedAt());
        return response;
    }
}
