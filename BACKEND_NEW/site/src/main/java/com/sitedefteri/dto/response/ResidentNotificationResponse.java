package com.sitedefteri.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for resident notification
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResidentNotificationResponse {
    private boolean success;
    private String message;
    private Long notificationId;
    private String status;
    private LocalDateTime createdAt;

    public static ResidentNotificationResponse success(Long notificationId, LocalDateTime createdAt) {
        ResidentNotificationResponse response = new ResidentNotificationResponse();
        response.setSuccess(true);
        response.setMessage("Kargo bildirimi oluşturuldu. Kargonuz geldiğinde size bildirim gönderilecek.");
        response.setNotificationId(notificationId);
        response.setStatus("pending_match");
        response.setCreatedAt(createdAt);
        return response;
    }

    public static ResidentNotificationResponse error(String message) {
        ResidentNotificationResponse response = new ResidentNotificationResponse();
        response.setSuccess(false);
        response.setMessage(message);
        return response;
    }
}
