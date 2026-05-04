package com.sitedefteri.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StaffShiftResponse {
    private String id;
    private String siteId;
    private String staffUserId;
    private LocalDateTime shiftDate;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime checkInTime;
    private LocalDateTime checkOutTime;
    private String status;
    private String notes;
    private LocalDateTime createdAt;
}
