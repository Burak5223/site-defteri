package com.sitedefteri.controller;

import com.sitedefteri.dto.request.*;
import com.sitedefteri.dto.response.AuthResponse;
import com.sitedefteri.dto.response.RegisterResponse;
import com.sitedefteri.dto.response.VerificationResponse;
import com.sitedefteri.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private final AuthService authService;
    
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
    
    @PostMapping("/send-verification")
    public ResponseEntity<VerificationResponse> sendVerification(@Valid @RequestBody SendVerificationRequest request) {
        return ResponseEntity.ok(authService.sendVerificationCode(request));
    }
    
    @PostMapping("/verify-phone")
    public ResponseEntity<VerificationResponse> verifyPhone(@Valid @RequestBody VerifyPhoneRequest request) {
        return ResponseEntity.ok(authService.verifyPhone(request));
    }
    
    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }
    
    /**
     * OTP doğrulama
     * POST /api/auth/verify-otp
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<RegisterResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        return ResponseEntity.ok(authService.verifyOtp(request.getPhoneNumber(), request.getOtpCode()));
    }
    
    /**
     * Token yenileme
     * POST /api/auth/refresh
     */
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refreshToken(request.getRefreshToken()));
    }
    
    /**
     * Çıkış yapma
     * POST /api/auth/logout
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(@RequestHeader("Authorization") String token) {
        authService.logout(token);
        return ResponseEntity.ok(Map.of("message", "Başarıyla çıkış yapıldı"));
    }
    
    /**
     * Şifre sıfırlama - OTP gönder
     * POST /api/auth/forgot-password/send-otp
     */
    @PostMapping("/forgot-password/send-otp")
    public ResponseEntity<VerificationResponse> forgotPasswordSendOtp(@Valid @RequestBody ForgotPasswordSendOtpRequest request) {
        return ResponseEntity.ok(authService.forgotPasswordSendOtp(request.getUsername(), request.getPhoneNumber()));
    }
    
    /**
     * Şifre sıfırlama - OTP doğrula
     * POST /api/auth/forgot-password/verify-otp
     */
    @PostMapping("/forgot-password/verify-otp")
    public ResponseEntity<Map<String, String>> forgotPasswordVerifyOtp(@Valid @RequestBody ForgotPasswordVerifyOtpRequest request) {
        authService.forgotPasswordVerifyOtp(request.getPhoneNumber(), request.getOtpCode());
        return ResponseEntity.ok(Map.of("message", "OTP doğrulandı", "success", "true"));
    }
    
    /**
     * Şifre sıfırlama - Yeni şifre belirle
     * POST /api/auth/forgot-password/reset
     */
    @PostMapping("/forgot-password/reset")
    public ResponseEntity<Map<String, String>> forgotPasswordReset(@Valid @RequestBody ForgotPasswordResetRequest request) {
        authService.forgotPasswordReset(request.getPhoneNumber(), request.getOtpCode(), request.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "Şifreniz başarıyla değiştirildi", "success", "true"));
    }
    
    /**
     * Şifre sıfırlama isteği (DEPRECATED - use forgot-password/send-otp)
     * POST /api/auth/forgot-password
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<VerificationResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(authService.forgotPassword(request.getPhoneNumber()));
    }
    
    /**
     * Şifre sıfırlama (DEPRECATED - use forgot-password/reset)
     * POST /api/auth/reset-password
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.getPhoneNumber(), request.getVerificationCode(), request.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "Şifre başarıyla sıfırlandı"));
    }
}
