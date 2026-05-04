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
public class ActivityLogResponse {
    private String id;
    private String adminId;
    private String adminName;
    private String actionType;
    private String targetType;
    private String targetId;
    private String description;
    private String ipAddress;
    private LocalDateTime createdAt;
}
