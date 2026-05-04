package com.sitedefteri.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CreateVotingTopicRequest {
    
    @NotBlank(message = "Site ID is required")
    private String siteId;
    
    private String meetingId;
    
    @NotBlank(message = "Title is required")
    private String title;
    
    private String description;
    
    @NotBlank(message = "Voting type is required")
    private String votingType; // evet_hayir, coklu_secim, acik_oy
    
    private String options; // JSON string
    
    @NotNull(message = "Start time is required")
    private LocalDateTime startsAt;
    
    @NotNull(message = "End time is required")
    private LocalDateTime endsAt;
    
    private Boolean requiresQuorum = false;
    
    private Integer quorumPercentage;
}
