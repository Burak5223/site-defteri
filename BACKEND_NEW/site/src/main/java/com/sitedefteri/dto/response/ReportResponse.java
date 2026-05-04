package com.sitedefteri.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportResponse {
    private String id;
    private String reportType;
    private String reportName;
    private String siteId;
    private String siteName;
    private LocalDate startDate;
    private LocalDate endDate;
    private String generatedBy;
    private String generatedByName;
    private String fileUrl;
    private String fileFormat;
    private String status; // pending, completed, failed
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
}
