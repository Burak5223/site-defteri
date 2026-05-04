package com.sitedefteri.dto.request;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class CreateVotingRequest {
    private String title;
    private String description;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private List<String> options;
}
