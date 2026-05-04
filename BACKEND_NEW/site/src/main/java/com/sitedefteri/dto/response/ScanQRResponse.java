package com.sitedefteri.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ScanQRResponse {
    
    private String userId;
    private String fullName;
    private String apartmentId;
    private String apartmentNumber;
    private String blockName;
    private List<PackageResponse> packages;
    private Integer packageCount;
}
