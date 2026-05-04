package com.sitedefteri.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class BlockResponse {
    private String id;
    private String siteId;
    private String name;
    private String description;
    private Integer totalFloors;
    private Integer totalApartments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
