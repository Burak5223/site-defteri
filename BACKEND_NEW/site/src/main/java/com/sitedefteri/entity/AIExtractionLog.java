package com.sitedefteri.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity for AI extraction audit logs
 * Tracks all Gemini Vision API calls for cargo slip photo processing
 */
@Entity
@Table(name = "ai_extraction_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AIExtractionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "site_id", nullable = false, length = 36)
    private String siteId;

    @Column(name = "security_user_id", nullable = false, length = 36)
    private String securityUserId;

    @Column(name = "photo_path", length = 500)
    private String photoPath;

    @Column(name = "gemini_raw_response", columnDefinition = "TEXT")
    private String geminiRawResponse;

    @Column(name = "extraction_success", nullable = false)
    private Boolean extractionSuccess;

    @Column(name = "api_response_time_ms")
    private Integer apiResponseTimeMs;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "photo_deleted_at")
    private LocalDateTime photoDeletedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
