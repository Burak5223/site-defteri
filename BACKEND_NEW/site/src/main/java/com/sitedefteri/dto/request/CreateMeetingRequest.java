package com.sitedefteri.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CreateMeetingRequest {
    
    @NotBlank(message = "Site ID is required")
    private String siteId;
    
    @NotBlank(message = "Title is required")
    private String title;
    
    private String description;
    
    @NotBlank(message = "Meeting type is required")
    private String meetingType; // genel_kurul, yonetim_kurulu, olagan_disi
    
    @NotNull(message = "Scheduled time is required")
    private LocalDateTime scheduledAt;
    
    private String location;
    
    private String agenda;
    
    private Integer quorumRequired;
}
