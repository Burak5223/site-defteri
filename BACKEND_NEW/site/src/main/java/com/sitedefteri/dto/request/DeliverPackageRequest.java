package com.sitedefteri.dto.request;

import lombok.Data;

@Data
public class DeliverPackageRequest {
    private String deliveredTo; // User ID who received the package
    private String deliveryPhotoUrl;
    private String deliverySignatureUrl;
    private String notes;
}
