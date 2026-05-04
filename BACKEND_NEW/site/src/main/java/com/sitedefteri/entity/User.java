package com.sitedefteri.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "users")
@Getter
@Setter
public class User extends BaseEntity {
    
    @Column(name = "full_name", nullable = false)
    private String fullName;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;
    
    private String phone;
    
    @Column(name = "site_id")
    private String siteId;
    
    @Column(name = "profile_photo_url")
    private String profilePhotoUrl;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status = UserStatus.aktif;
    
    @Column(name = "email_verified")
    private Boolean emailVerified = false;
    
    @Column(name = "phone_verified")
    private Boolean phoneVerified = false;
    
    @Column(name = "preferred_language")
    private String preferredLanguage = "tr";
    
    @Column(name = "user_qr_token", length = 36, unique = true)
    private String userQrToken;
    
    @Column(name = "telegram_chat_id")
    private Long telegramChatId;
    
    @Column(name = "fcm_token")
    private String fcmToken;
    
    @Column(name = "otp_code", length = 6)
    private String otpCode;
    
    @Column(name = "otp_expiry")
    private java.time.LocalDateTime otpExpiry;
    
    @Column(name = "otp_verified")
    private Boolean otpVerified = false;
    
    public enum UserStatus {
        dogrulama_bekliyor, aktif, askida, yasakli
    }
}
