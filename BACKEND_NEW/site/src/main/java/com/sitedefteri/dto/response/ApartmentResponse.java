package com.sitedefteri.dto.response;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ApartmentResponse {
    private String id;
    private String blockId;
    private String blockName;
    private String unitNumber;
    private Integer floor;
    private String unitType;
    private BigDecimal area;
    private Integer bedrooms;
    private Integer bathrooms;
    private String status;
    private String ownerUserId;
    private String ownerName;
    private String currentResidentId;
    private String currentResidentName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
