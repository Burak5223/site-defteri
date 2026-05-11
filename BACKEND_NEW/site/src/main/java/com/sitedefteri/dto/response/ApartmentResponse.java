package com.sitedefteri.dto.response;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

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
    private String ownerEmail;
    private String ownerPhone;
    private String currentResidentId;
    private String currentResidentName;
    private String currentResidentEmail;
    private String currentResidentPhone;
    private Integer residentCount;
    private List<ResidentInfo> residents = new ArrayList<>();
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    @Data
    public static class ResidentInfo {
        private String id;
        private String fullName;
        private String email;
        private String phone;
        private String residentType; // "owner" or "tenant"
    }
}
