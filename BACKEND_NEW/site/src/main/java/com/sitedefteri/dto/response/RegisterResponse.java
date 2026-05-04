package com.sitedefteri.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterResponse {
    private String userId;
    private String phoneNumber;
    private String email;
    private String status;
    private boolean pending; // Telefon doğrulaması bekleniyor mu?
    private boolean success;
    private String message;
    private boolean requiresOtp; // OTP doğrulaması gerekiyor mu?
    private String telegramBotLink; // Telegram bot linki
}
