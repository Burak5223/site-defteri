package com.sitedefteri.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SessionResponse {
    private String id; // Changed from Long to String to match BaseEntity
    private String deviceInfo;
    private String ipAddress;
    private LocalDateTime lastActivity;
    private LocalDateTime expiresAt;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
