package com.sitedefteri.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateMessageRequest {
    
    @NotBlank(message = "Site ID is required")
    private String siteId;
    
    private String receiverId; // null for group messages
    
    private String apartmentId; // for apartment-based messaging
    
    @NotBlank(message = "Chat type is required")
    private String chatType; // group, security, direct, apartment
    
    @NotBlank(message = "Message body is required")
    private String body;
    
    private String attachmentUrl;
    private String attachmentType;
}
