package com.sitedefteri.dto.response;

import lombok.Data;

@Data
public class VotingOptionResponse {
    private Long id;
    private String optionText;
    private Integer displayOrder;
    private Long voteCount;
    private Double percentage;
}
