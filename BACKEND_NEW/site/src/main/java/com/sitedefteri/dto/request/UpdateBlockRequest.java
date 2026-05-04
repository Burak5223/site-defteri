package com.sitedefteri.dto.request;

import lombok.Data;

@Data
public class UpdateBlockRequest {
    private String blockName;
    private Integer floors;
    private Integer apartmentsPerFloor;
}
