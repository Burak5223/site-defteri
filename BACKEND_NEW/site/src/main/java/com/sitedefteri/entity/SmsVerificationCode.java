package com.sitedefteri.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "sms_verification_codes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SmsVerificationCode {
    
    @Id
    @Column(length = 36)
    private String id;
    
    @Column(name = "phone_number", nullable = false, length = 20)
    private String phoneNumber;
    
    @Column(name = "verification_code", nullable = false, length = 6)
    private String verificationCode;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private VerificationPurpose purpose = VerificationPurpose.register;
    
    @Column(name = "is_verified", nullable = false)
    @Builder.Default
    private Boolean isVerified = false;
    
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
    
    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;
    
    @Column(nullable = false)
    @Builder.Default
    private Integer attempts = 0;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = java.util.UUID.randomUUID().toString();
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
    
    // Alias methods for backward compatibility
    public String getCode() {
        return verificationCode;
    }
    
    public void setCode(String code) {
        this.verificationCode = code;
    }
    
    public Boolean getIsUsed() {
        return isVerified;
    }
    
    public void setIsUsed(Boolean isUsed) {
        this.isVerified = isUsed;
    }
    
    public enum VerificationPurpose {
        register, login, password_reset, phone_change
    }
}
