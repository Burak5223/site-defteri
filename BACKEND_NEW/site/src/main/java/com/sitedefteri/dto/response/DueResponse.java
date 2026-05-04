package com.sitedefteri.dto.response;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class DueResponse {
    private String id;
    private String apartmentId;
    private String apartmentNumber;
    private BigDecimal amount;
    private LocalDate dueDate;
    private String status;
    private String description;
    private String month;
    private Integer year;
    private String period;
    private String residentName;
    private String ownerName;
}
