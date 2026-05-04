package com.sitedefteri.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class BulkDeliveryRequest {
    
    @NotEmpty(message = "En az bir paket seçilmelidir")
    private List<String> packageIds;
}
