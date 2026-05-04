package com.sitedefteri.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttachmentResponse {
    private String id;
    private String siteId;
    private String entityType;
    private String entityId;
    private String fileName;
    private String filePath;
    private Long fileSize;
    private String mimeType;
    private String uploadedBy;
    private String description;
    private String downloadUrl;
    private LocalDateTime createdAt;
}
