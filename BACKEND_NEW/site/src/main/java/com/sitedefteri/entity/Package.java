package com.sitedefteri.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "packages")
@Getter
@Setter
public class Package extends BaseEntity {
    
    @Column(name = "apartment_id", nullable = false)
    private String apartmentId;
    
    @Column(name = "courier_name")
    private String courierName;
    
    @Column(name = "tracking_number")
    private String trackingNumber;  // Geçici - migration sonrası kaldırılacak
    
    @Column(name = "tracking_masked", length = 20)
    private String trackingMasked;  // KVKK uyumlu: "TR****45"
    
    @Column(name = "tracking_hash", length = 64)
    private String trackingHash;    // SHA-256 hash (doğrulama için)
    
    @Column(name = "sender_name")
    private String senderName;
    
    @Column(name = "recipient_name")
    private String recipientName;
    
    @Column(name = "package_size")
    private String packageSize;
    
    @Column(name = "package_type", length = 50)
    private String packageType;     // Koli, Zarf, Küçük, Büyük
    
    @Column(nullable = false)
    private String status = "beklemede";  // Default: waiting for delivery
    
    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt;
    
    @Column(name = "recorded_by")
    private String recordedBy;      // Audit için (sadece admin görebilir)
    
    @Column(name = "received_by_role", length = 20)
    private String receivedByRole;  // KVKK uyumlu: "SECURITY" (kişi değil rol)
    
    @Column(name = "delivered_by_role", length = 20)
    private String deliveredByRole; // KVKK uyumlu: "SECURITY" (kişi değil rol)
    
    @Column(name = "notified_at")
    private LocalDateTime notifiedAt;
    
    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;
    
    @Column(name = "delivered_to")
    private String deliveredTo;
    
    @Column(name = "notify_conversation_id")
    private String notifyConversationId;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    @Column(name = "photo_url", columnDefinition = "TEXT")
    private String photoUrl;
    
    @Column(name = "delivery_photo_url", columnDefinition = "TEXT")
    private String deliveryPhotoUrl;
    
    @Column(name = "delivery_signature_url", columnDefinition = "TEXT")
    private String deliverySignatureUrl;
    
    // QR Token Sistemi - Güvenli Paket Teslimi
    @Column(name = "qr_token", length = 36, unique = true)
    private String qrToken;  // UUID token (paket için benzersiz)
    
    @Column(name = "qr_token_created_at")
    private LocalDateTime qrTokenCreatedAt;
    
    @Column(name = "qr_token_expires_at")
    private LocalDateTime qrTokenExpiresAt;  // 7 gün sonra
    
    @Column(name = "qr_token_used")
    private Boolean qrTokenUsed = false;  // Token kullanıldı mı?
    
    @Column(name = "block_id")
    private String blockId;
    
    @Column(name = "site_id")
    private String siteId;
    
    // AI Cargo Registration Fields
    @Column(name = "ai_extracted")
    private Boolean aiExtracted = false;  // Was this cargo extracted by AI?
    
    @Column(name = "ai_extraction_log_id")
    private Long aiExtractionLogId;  // Reference to AI extraction log
    
    @Column(name = "matched_notification_id")
    private Long matchedNotificationId;  // Reference to resident notification
    
    // Delivery Code System - Resident can enter code from courier company
    @Column(name = "delivery_code", length = 50)
    private String deliveryCode;  // Optional code from courier company (e.g., "1234", "ABC123")
    
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
    
    @Column(name = "deleted_by")
    private String deletedBy;
    
    @PrePersist
    protected void onCreate() {
        super.onCreate();
        if (recordedAt == null) {
            recordedAt = LocalDateTime.now();
        }
    }
}
