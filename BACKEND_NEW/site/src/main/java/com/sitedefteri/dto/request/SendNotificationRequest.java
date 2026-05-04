package com.sitedefteri.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SendNotificationRequest {
    private String userId;
    private String title;
    private String body;
    private String type;
    private Map<String, String> data;
}
