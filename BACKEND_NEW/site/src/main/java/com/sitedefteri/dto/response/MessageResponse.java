package com.sitedefteri.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {
    private String id;
    private String siteId;
    private String senderId;
    private String senderName;
    private String senderRole;
    private String receiverId;
    private String receiverName;
    private String receiverRole;
    private String apartmentId;
    private String apartmentNumber;
    private String chatType;
    private String body;
    private Boolean isRead;
    private LocalDateTime readAt;
    private String attachmentUrl;
    private String attachmentType;
    private LocalDateTime createdAt;
}
