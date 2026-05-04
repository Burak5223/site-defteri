package com.sitedefteri.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkAnnouncementResponse {
    private String id;
    private String title;
    private String content;
    private String priority;
    private String targetType;
    private List<String> targetSiteIds;
    private String createdBy;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private Integer totalSitesReached;
    private Integer totalUsersReached;
}
