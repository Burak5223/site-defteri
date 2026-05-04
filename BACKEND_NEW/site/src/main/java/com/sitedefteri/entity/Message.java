package com.sitedefteri.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Message {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "site_id", nullable = false, length = 36)
    private String siteId;
    
    @Column(name = "sender_id", nullable = false, length = 36)
    private String senderId;
    
    @Column(name = "receiver_id", length = 36)
    private String receiverId;
    
    @Column(name = "sender_name")
    private String senderName;
    
    @Column(name = "sender_role")
    private String senderRole;
    
    @Column(name = "receiver_name")
    private String receiverName;
    
    @Column(name = "receiver_role")
    private String receiverRole;
    
    @Column(name = "chat_type", nullable = false)
    private String chatType; // 'group', 'security', 'apartment'
    
    @Column(name = "apartment_id", length = 36)
    private String apartmentId; // Changed from Long to String to match apartments.id (UUID)
    
    @Transient
    private String apartmentNumber; // Not stored in DB, populated when needed
    
    @Column(name = "body", columnDefinition = "TEXT")
    private String body;
    
    @Column(name = "is_read")
    @Builder.Default
    private Boolean isRead = false;
    
    @Column(name = "read_at")
    private LocalDateTime readAt;
    
    @Column(name = "attachment_url")
    private String attachmentUrl;
    
    @Column(name = "attachment_type")
    private String attachmentType;
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
