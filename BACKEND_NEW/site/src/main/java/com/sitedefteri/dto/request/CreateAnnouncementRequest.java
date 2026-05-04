package com.sitedefteri.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateAnnouncementRequest {
    @NotBlank
    private String title;
    
    @NotBlank
    private String content;
    
    private String priority;
}
