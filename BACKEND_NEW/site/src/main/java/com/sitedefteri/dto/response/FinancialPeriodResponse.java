package com.sitedefteri.dto.response;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class FinancialPeriodResponse {
    private String id;
    private String siteId;
    private String periodName;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status; // active, closed
    private String description;
    private LocalDateTime createdAt;
}
