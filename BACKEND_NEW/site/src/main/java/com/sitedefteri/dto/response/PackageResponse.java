package com.sitedefteri.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * KVKK Uyumlu Package Response
 * Kişisel veriler (recorded_by, delivered_to) dahil edilmez
 */
@Data
public class PackageResponse {
    private String id;
    private String apartmentId;
    private String apartmentNumber;  // Daire numarası (örn: "A-101", "34")
    private String blockId;
    private String blockName;  // Blok adı (örn: "A Blok")
    private String siteId;
    
    // KVKK Uyumlu: Maskeli takip numarası
    private String trackingMasked;  // "TR****45"
    
    // Full tracking number (only for SECURITY and ADMIN roles)
    private String trackingNumber;  // Full number, null for RESIDENT
    
    private String courierName;
    private String senderName;
    private String recipientName;
    private String packageSize;
    private String packageType;
    private String status;
    private String notes;
    private String photoUrl;
    private String deliveryPhotoUrl;
    private String deliverySignatureUrl;
    
    // QR Token (Sadece güvenlik görebilir)
    private String qrToken;
    private LocalDateTime qrTokenExpiresAt;
    private Boolean qrTokenUsed;
    
    // KVKK Uyumlu: Rol bazlı bilgi (kişi değil)
    private String receivedByRole;  // "SECURITY"
    private String deliveredByRole; // "SECURITY"
    
    private LocalDateTime recordedAt;
    private LocalDateTime arrivalDate;  // Geliş tarihi (recordedAt ile aynı)
    private LocalDateTime deliveredAt;
    private LocalDateTime notifiedAt;
    private String notifyConversationId;
    
    // AI Cargo Registration fields
    private Boolean aiExtracted;  // AI badge indicator
    private Long aiExtractionLogId;
    private Long matchedNotificationId;
    
    // Delivery Code - Optional code from courier company
    private String deliveryCode;  // Resident can enter this code
    
    // NOT: recorded_by ve delivered_to dahil edilmez (KVKK)
    // Sadece admin endpoint'inde gösterilir
}
