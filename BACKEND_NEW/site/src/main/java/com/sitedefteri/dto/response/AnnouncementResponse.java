package com.sitedefteri.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AnnouncementResponse {
    private String id;
    private String title;
    private String content;
    private String priority;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
}
