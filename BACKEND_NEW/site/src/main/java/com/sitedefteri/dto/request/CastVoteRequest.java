package com.sitedefteri.dto.request;

import lombok.Data;

@Data
public class CastVoteRequest {
    private Long votingId;
    private Long optionId;
}
