package com.sitedefteri.dto.response;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class SiteResponse {
    private String id;
    private String name;
    private String address;
    private String city;
    private String country;
    private String postalCode;
    private String subscriptionStatus;
    private LocalDate subscriptionExpiry;
    private String logoUrl;
    private String timezone;
    private Integer totalApartments;
    private Integer totalResidents;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
