package com.sitedefteri.dto.response;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class VotingResponse {
    private Long id;
    private String title;
    private String description;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String status;
    private String createdBy;
    private LocalDateTime createdAt;
    private List<VotingOptionResponse> options;
    private long totalVotes;
    private Boolean hasVoted;
    private Long userVotedOptionId;
}
