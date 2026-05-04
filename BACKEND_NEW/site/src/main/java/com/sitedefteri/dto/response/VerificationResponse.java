package com.sitedefteri.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerificationResponse {
    private boolean success;
    private String message;
    private String token; // Doğrulama başarılıysa JWT token
    private String phoneNumber; // For testing
    private String code; // For testing only - remove in production
    private String telegramBotLink; // Telegram bot deep link for OTP
}
