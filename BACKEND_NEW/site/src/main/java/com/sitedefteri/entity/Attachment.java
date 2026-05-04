package com.sitedefteri.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "attachments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Attachment extends BaseEntity {
    
    @Column(name = "site_id", nullable = false)
    private String siteId;
    
    @Column(name = "entity_type", nullable = false)
    private String entityType; // TICKET, ANNOUNCEMENT, EXPENSE, etc.
    
    @Column(name = "entity_id", nullable = false)
    private String entityId;
    
    @Column(name = "file_name", nullable = false)
    private String fileName;
    
    @Column(name = "file_path", nullable = false)
    private String filePath;
    
    @Column(name = "file_size")
    private Long fileSize;
    
    @Column(name = "mime_type")
    private String mimeType;
    
    @Column(name = "uploaded_by", nullable = false)
    private String uploadedBy;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
}
