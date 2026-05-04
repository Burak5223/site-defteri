package com.sitedefteri.dto.request;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpdateApartmentRequest {
    private String unitNumber;
    private Integer floor;
    private String unitType;
    private BigDecimal area;
    private Integer bedrooms;
    private Integer bathrooms;
    private String status; // dolu, bos, tadilatta
    private String ownerUserId;
    private String currentResidentId;
}
