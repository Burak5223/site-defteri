package com.sitedefteri.service;

import com.sitedefteri.dto.request.LoginRequest;
import com.sitedefteri.dto.request.RegisterRequest;
import com.sitedefteri.dto.request.SendVerificationRequest;
import com.sitedefteri.dto.request.VerifyPhoneRequest;
import com.sitedefteri.dto.response.AuthResponse;
import com.sitedefteri.dto.response.RegisterResponse;
import com.sitedefteri.dto.response.UserResponse;
import com.sitedefteri.dto.response.VerificationResponse;
import com.sitedefteri.entity.User;
import com.sitedefteri.exception.BadRequestException;
import com.sitedefteri.exception.UnauthorizedException;
import com.sitedefteri.repository.UserRepository;
import com.sitedefteri.security.JwtTokenProvider;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final SmsService smsService;
    private final SessionService sessionService;
    private final NotificationService notificationService;
    private final EntityManager entityManager;
    
    public AuthResponse login(LoginRequest request) {
        log.info("Login attempt for email: {} or phone: {}", request.getEmail(), request.getPhoneNumber());
        
        User user;
        
        // Try to find user by email or phone number
        if (request.getEmail() != null && !request.getEmail().isEmpty()) {
            user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new UnauthorizedException("Email veya şifre hatalı"));
        } else if (request.getPhoneNumber() != null && !request.getPhoneNumber().isEmpty()) {
            user = userRepository.findByPhone(request.getPhoneNumber())
                    .orElseThrow(() -> new UnauthorizedException("Telefon numarası veya şifre hatalı"));
        } else {
            throw new BadRequestException("Email veya telefon numarası gerekli");
        }
        
        // BCrypt password verification
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Email veya şifre hatalı");
        }
        
        // Determine role based on email (temporary solution)
        String role = getUserRole(user);
        
        // Get user's site ID (temporary: use "1", later get from user_sites table)
        String siteId = getUserSiteId(user);
        
        // Generate token with role and siteId
        String token = tokenProvider.generateToken(
            user.getId(), 
            user.getEmail(), 
            role, 
            siteId
        );
        
        log.info("Login successful for user: {}, role: {}, siteId: {}", user.getId(), role, siteId);
        
        // Get user's apartment ID from residency_history (for residents)
        String apartmentId = null;
        if ("ROLE_RESIDENT".equals(role)) {
            apartmentId = getUserApartmentId(user.getId());
            log.info("User apartment ID: {}", apartmentId);
        }
        
        UserResponse userResponse = new UserResponse();
        userResponse.setId(user.getId());
        userResponse.setFullName(user.getFullName());
        userResponse.setEmail(user.getEmail());
        userResponse.setPhone(user.getPhone());
        userResponse.setStatus(user.getStatus().name());
        userResponse.setSiteId(siteId); // Set siteId in user response
        userResponse.setApartmentId(apartmentId); // Set apartmentId for residents
        
        List<String> roles = new ArrayList<>();
        roles.add(role);
        
        AuthResponse authResponse = new AuthResponse(token, user.getId(), roles, userResponse);
        authResponse.setSiteId(siteId); // Set siteId in auth response
        return authResponse;
    }
    
    private String getUserRole(User user) {
        // Get actual role from database
        try {
            List<String> roles = userRepository.findRolesByUserId(user.getId());
            if (roles != null && !roles.isEmpty()) {
                // Get the first role and normalize it
                String roleName = roles.get(0).toUpperCase(Locale.ENGLISH);
                log.info("User {} has role from DB: {}", user.getEmail(), roleName);
                
                // If already in ROLE_ format, return as is
                if (roleName.startsWith("ROLE_")) {
                    log.info("Role already in ROLE_ format: {}", roleName);
                    return roleName;
                }
                
                // Map old Turkish role names to ROLE_ format
                switch (roleName) {
                    case "SUPER_ADMIN":
                        return "ROLE_SUPER_ADMIN";
                    case "YONETICI":
                    case "ADMIN":
                        return "ROLE_ADMIN";
                    case "GUVENLIK":
                    case "SECURITY":
                        return "ROLE_SECURITY";
                    case "TEMIZLIK":
                    case "TEMIZLIK_PERSONELI":
                    case "TEMIZLIK PERSONELI":
                    case "CLEANING":
                        return "ROLE_CLEANING";
                    case "SAKIN":
                    case "RESIDENT":
                        return "ROLE_RESIDENT";
                    default:
                        // Add ROLE_ prefix if not present
                        log.warn("Unknown role: {}, adding ROLE_ prefix", roleName);
                        return "ROLE_" + roleName;
                }
            }
        } catch (Exception e) {
            log.error("Error fetching user roles", e);
        }
        
        // Fallback: determine by email
        log.warn("No role found in DB for user {}, using email-based fallback", user.getEmail());
        if (user.getEmail().contains("superadmin")) {
            return "ROLE_SUPER_ADMIN";
        } else if (user.getEmail().contains("admin")) {
            return "ROLE_ADMIN";
        } else if (user.getEmail().contains("guvenlik") || user.getEmail().contains("security")) {
            return "ROLE_SECURITY";
        } else if (user.getEmail().contains("temizlik") || user.getEmail().contains("cleaning")) {
            return "ROLE_CLEANING";
        } else {
            return "ROLE_RESIDENT";
        }
    }
    
    private String getUserSiteId(User user) {
        // Get from user's site memberships (use the first active membership)
        try {
            List<String> siteIds = userRepository.findSiteIdsByUserId(user.getId());
            if (siteIds != null && !siteIds.isEmpty()) {
                log.info("User {} has site memberships: {}", user.getEmail(), siteIds);
                return siteIds.get(0); // Use first site ID
            }
        } catch (Exception e) {
            log.error("Error fetching user site memberships", e);
        }
        
        // Fallback: Get from user's site_id column
        if (user.getSiteId() != null && !user.getSiteId().isEmpty()) {
            return user.getSiteId();
        }
        // Default fallback
        return "1";
    }
    
    @Transactional
    public VerificationResponse sendVerificationCode(SendVerificationRequest request) {
        String phoneNumber = request.getPhoneNumber();
        
        // Check if phone already exists
        if (userRepository.findByPhone(phoneNumber).isPresent()) {
            throw new BadRequestException("Bu telefon numarası zaten kayıtlı");
        }
        
        // Send verification code
        String code = smsService.sendVerificationCode(phoneNumber);
        
        log.info("Verification code sent to: {}", phoneNumber);
        
        VerificationResponse response = new VerificationResponse();
        response.setSuccess(true);
        response.setMessage("Doğrulama kodu gönderildi");
        response.setPhoneNumber(phoneNumber);
        // For testing only - remove in production
        response.setCode(code);
        
        return response;
    }
    
    @Transactional
    public VerificationResponse verifyPhone(VerifyPhoneRequest request) {
        boolean isValid = smsService.verifyCode(request.getPhoneNumber(), request.getCode());
        
        if (!isValid) {
            smsService.incrementAttempts(request.getPhoneNumber(), request.getCode());
            throw new BadRequestException("Geçersiz veya süresi dolmuş doğrulama kodu");
        }
        
        VerificationResponse response = new VerificationResponse();
        response.setSuccess(true);
        response.setMessage("Telefon numarası doğrulandı");
        response.setPhoneNumber(request.getPhoneNumber());
        
        return response;
    }
    
    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        log.info("Register attempt for phone: {}, fullName: {}, email: {}", request.getPhoneNumber(), request.getFullName(), request.getEmail());
        
        // Normalize phone number
        String normalizedPhone = normalizePhoneNumber(request.getPhoneNumber());
        log.info("Normalized phone: {}", normalizedPhone);
        
        // IMPORTANT: Find invited user by phone number
        // This ensures only users invited by admin can register
        User invitedUser = userRepository.findByPhone(normalizedPhone)
                .orElseThrow(() -> new BadRequestException("Bu telefon numarası sistemde kayıtlı değil. Lütfen yöneticinizle iletişime geçin."));
        
        // Verify full name matches (case-insensitive, trim whitespace)
        String requestedName = request.getFullName().trim().toLowerCase(Locale.forLanguageTag("tr-TR"));
        String invitedName = invitedUser.getFullName().trim().toLowerCase(Locale.forLanguageTag("tr-TR"));
        
        if (!requestedName.equals(invitedName)) {
            log.warn("Name mismatch: requested='{}', invited='{}'", requestedName, invitedName);
            throw new BadRequestException("Ad soyad bilgisi sistemdeki kayıtla eşleşmiyor. Lütfen yöneticinizin kaydettiği ad soyadı giriniz.");
        }
        
        // Verify email matches (case-insensitive, trim whitespace)
        String requestedEmail = request.getEmail().trim().toLowerCase(Locale.forLanguageTag("tr-TR"));
        String invitedEmail = invitedUser.getEmail() != null ? invitedUser.getEmail().trim().toLowerCase(Locale.forLanguageTag("tr-TR")) : "";
        
        if (!requestedEmail.equals(invitedEmail)) {
            log.warn("Email mismatch: requested='{}', invited='{}'", requestedEmail, invitedEmail);
            throw new BadRequestException("E-posta adresi sistemdeki kayıtla eşleşmiyor. Lütfen yöneticinizin kaydettiği e-posta adresini giriniz.");
        }
        
        // Check if user already has registered with this email
        // Allow password reset if user wants to change their password
        if (invitedUser.getPasswordHash() != null && !invitedUser.getPasswordHash().isEmpty()) {
            // Check if email matches - if yes, allow password update
            if (invitedUser.getEmail() != null && invitedUser.getEmail().equals(request.getEmail())) {
                log.info("User already has password, updating password for: {}", invitedUser.getEmail());
                // Continue to update password
            } else {
                throw new BadRequestException("Bu kullanıcı zaten kayıt olmuş. Giriş yapabilirsiniz.");
            }
        }
        
        // Check if email is already used by another user
        final String invitedUserId = invitedUser.getId();
        userRepository.findByEmail(request.getEmail()).ifPresent(existingUser -> {
            if (!existingUser.getId().equals(invitedUserId)) {
                throw new BadRequestException("Bu email adresi başka bir kullanıcı tarafından kullanılıyor.");
            }
        });
        
        // Update user with registration data (but keep status as dogrulama_bekliyor until OTP verified)
        invitedUser.setEmail(request.getEmail());
        // Encode password with BCrypt
        invitedUser.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        invitedUser.setStatus(User.UserStatus.dogrulama_bekliyor); // Wait for OTP verification
        invitedUser.setPhoneVerified(false); // Will be set to true after OTP verification
        invitedUser.setEmailVerified(false);
        
        // OTOMATIK OTP ÜRET
        String otpCode = generateOtpCode();
        invitedUser.setOtpCode(otpCode);
        invitedUser.setOtpExpiry(java.time.LocalDateTime.now().plusMinutes(3)); // 3 dakika geçerli
        invitedUser.setOtpVerified(false);
        
        invitedUser = userRepository.save(invitedUser);
        
        log.info("User registration data saved with OTP: {} ({}), OTP: {}", invitedUser.getEmail(), invitedUser.getId(), otpCode);
        
        // TELEGRAM BOT LİNKİ İLE PUSH NOTIFICATION GÖNDER
        String phoneForUrl = invitedUser.getPhone().replaceAll("[^0-9]", ""); // Sadece rakamlar
        String telegramBotLink = "https://t.me/sakin_onay_bot?start=PHONE_" + phoneForUrl;
        
        try {
            notificationService.sendTelegramOtpNotification(
                invitedUser.getId(),
                "Telegram Doğrulama",
                "Kayıt işleminizi tamamlamak için Telegram bot'umuza giriş yapın: " + telegramBotLink,
                telegramBotLink
            );
            log.info("Telegram OTP notification sent to user: {}", invitedUser.getId());
        } catch (Exception e) {
            log.error("Failed to send Telegram OTP notification", e);
            // Don't fail registration if notification fails
        }
        
        log.info("User registration completed, waiting for OTP verification: {} ({})", invitedUser.getEmail(), invitedUser.getId());
        
        RegisterResponse response = new RegisterResponse();
        response.setSuccess(true);
        response.setMessage("Kayıt bilgileriniz alındı. Lütfen Telegram'dan gelen 6 haneli kodu giriniz.");
        response.setUserId(invitedUser.getId());
        response.setEmail(invitedUser.getEmail());
        response.setPhoneNumber(invitedUser.getPhone());
        response.setStatus(invitedUser.getStatus().name());
        response.setRequiresOtp(true); // Indicate that OTP verification is required
        response.setTelegramBotLink(telegramBotLink); // Send Telegram link to frontend
        
        return response;
    }
    
    @Transactional
    public RegisterResponse verifyOtp(String phoneNumber, String otpCode) {
        log.info("OTP verification attempt for phone: {}", phoneNumber);
        
        // Normalize phone number
        String normalizedPhone = normalizePhoneNumber(phoneNumber);
        log.info("Normalized phone: {}", normalizedPhone);
        
        // Find user by phone number
        User user = userRepository.findByPhone(normalizedPhone)
                .orElseThrow(() -> new BadRequestException("Kullanıcı bulunamadı"));
        
        // Check if OTP code matches
        if (user.getOtpCode() == null || !user.getOtpCode().equals(otpCode)) {
            log.warn("Invalid OTP code for user: {}", user.getEmail());
            throw new BadRequestException("Geçersiz doğrulama kodu");
        }
        
        // Check if OTP has expired
        if (user.getOtpExpiry() == null || user.getOtpExpiry().isBefore(java.time.LocalDateTime.now())) {
            log.warn("Expired OTP code for user: {}", user.getEmail());
            throw new BadRequestException("Doğrulama kodunun süresi dolmuş. Lütfen yeni kod alınız.");
        }
        
        // OTP is valid - activate user
        user.setStatus(User.UserStatus.aktif);
        user.setPhoneVerified(true);
        user.setOtpVerified(true);
        user.setOtpCode(null); // Clear OTP code after successful verification
        user.setOtpExpiry(null);
        
        user = userRepository.save(user);
        
        log.info("OTP verification successful for user: {} ({})", user.getEmail(), user.getId());
        
        RegisterResponse response = new RegisterResponse();
        response.setSuccess(true);
        response.setMessage("Doğrulama başarılı! Şimdi giriş yapabilirsiniz.");
        response.setUserId(user.getId());
        response.setEmail(user.getEmail());
        response.setPhoneNumber(user.getPhone());
        response.setStatus(user.getStatus().name());
        response.setRequiresOtp(false);
        
        return response;
    }
    
    public AuthResponse refreshToken(String refreshToken) {
        log.info("Refreshing token");
        
        // TODO: Implement proper refresh token logic with database storage
        // For now, just validate and regenerate
        
        try {
            String userId = tokenProvider.getUserIdFromToken(refreshToken);
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new UnauthorizedException("Kullanıcı bulunamadı"));
            
            String role = getUserRole(user);
            String siteId = getUserSiteId(user);
            
            String newToken = tokenProvider.generateToken(user.getId(), user.getEmail(), role, siteId);
            
            UserResponse userResponse = new UserResponse();
            userResponse.setId(user.getId());
            userResponse.setFullName(user.getFullName());
            userResponse.setEmail(user.getEmail());
            userResponse.setPhone(user.getPhone());
            userResponse.setStatus(user.getStatus().name());
            
            List<String> roles = new ArrayList<>();
            roles.add(role);
            
            log.info("Token refreshed for user: {}", userId);
            return new AuthResponse(newToken, user.getId(), roles, userResponse);
        } catch (Exception e) {
            throw new UnauthorizedException("Geçersiz token");
        }
    }
    
    public void logout(String token) {
        log.info("User logout");
        // TODO: Implement token blacklisting or session invalidation
        // For now, just log the action
        // In production, you would:
        // 1. Add token to blacklist in Redis/Database
        // 2. Invalidate user session
        // 3. Clear any cached data
    }
    
    /**
     * Şifre sıfırlama - OTP gönder (Yeni sistem)
     * Kullanıcı adı ve telefon numarasını doğrular, eşleşiyorsa Telegram OTP gönderir
     */
    @Transactional
    public VerificationResponse forgotPasswordSendOtp(String username, String phoneNumber) {
        log.info("Forgot password OTP request - username: {}, phone: {}", username, phoneNumber);
        
        // Normalize phone number
        String normalizedPhone = normalizePhoneNumber(phoneNumber);
        
        // Find user by phone number
        User user = userRepository.findByPhone(normalizedPhone)
                .orElseThrow(() -> new BadRequestException("Bu telefon numarasına kayıtlı kullanıcı bulunamadı"));
        
        // Verify username matches (case-insensitive)
        String userEmail = user.getEmail() != null ? user.getEmail().toLowerCase(Locale.forLanguageTag("tr-TR")) : "";
        String requestedUsername = username.toLowerCase(Locale.forLanguageTag("tr-TR"));
        
        // Check if username matches email (without @domain)
        String emailUsername = userEmail.contains("@") ? userEmail.substring(0, userEmail.indexOf("@")) : userEmail;
        
        if (!emailUsername.equals(requestedUsername) && !userEmail.equals(requestedUsername)) {
            log.warn("Username mismatch for phone {}: requested='{}', email='{}'", normalizedPhone, requestedUsername, userEmail);
            throw new BadRequestException("Kullanıcı adı ve telefon numarası eşleşmiyor");
        }
        
        // Generate OTP code
        String otpCode = generateOtpCode();
        
        // Save OTP to user
        user.setOtpCode(otpCode);
        user.setOtpExpiry(java.time.LocalDateTime.now().plusMinutes(3)); // 3 minutes validity
        user.setOtpVerified(false);
        userRepository.save(user);
        
        log.info("OTP generated for forgot password: user={}, phone={}", user.getEmail(), normalizedPhone);
        
        // Send Telegram notification with OTP
        String phoneForUrl = normalizedPhone.replaceAll("[^0-9]", "");
        String telegramBotLink = "https://t.me/sakin_onay_bot?start=PHONE_" + phoneForUrl;
        
        try {
            notificationService.sendTelegramOtpNotification(
                user.getId(),
                "Şifre Sıfırlama",
                "Şifrenizi sıfırlamak için Telegram bot'umuza giriş yapın: " + telegramBotLink,
                telegramBotLink
            );
            log.info("Telegram OTP notification sent for forgot password: {}", user.getId());
        } catch (Exception e) {
            log.error("Failed to send Telegram OTP notification for forgot password", e);
            // Don't fail the request if notification fails
        }
        
        VerificationResponse response = new VerificationResponse();
        response.setSuccess(true);
        response.setMessage("Doğrulama kodu Telegram'a gönderildi");
        response.setPhoneNumber(normalizedPhone);
        response.setTelegramBotLink(telegramBotLink);
        
        return response;
    }
    
    /**
     * Şifre sıfırlama - OTP doğrula
     */
    @Transactional
    public void forgotPasswordVerifyOtp(String phoneNumber, String otpCode) {
        log.info("Verifying OTP for forgot password: phone={}", phoneNumber);
        
        // Normalize phone number
        String normalizedPhone = normalizePhoneNumber(phoneNumber);
        
        // Find user by phone number
        User user = userRepository.findByPhone(normalizedPhone)
                .orElseThrow(() -> new BadRequestException("Kullanıcı bulunamadı"));
        
        // Check if OTP code matches
        if (user.getOtpCode() == null || !user.getOtpCode().equals(otpCode)) {
            log.warn("Invalid OTP code for forgot password: user={}", user.getEmail());
            throw new BadRequestException("Geçersiz doğrulama kodu");
        }
        
        // Check if OTP has expired
        if (user.getOtpExpiry() == null || user.getOtpExpiry().isBefore(java.time.LocalDateTime.now())) {
            log.warn("Expired OTP code for forgot password: user={}", user.getEmail());
            throw new BadRequestException("Doğrulama kodunun süresi dolmuş");
        }
        
        // Mark OTP as verified (but don't clear it yet - needed for password reset)
        user.setOtpVerified(true);
        userRepository.save(user);
        
        log.info("OTP verified for forgot password: user={}", user.getEmail());
    }
    
    /**
     * Şifre sıfırlama - Yeni şifre belirle
     */
    @Transactional
    public void forgotPasswordReset(String phoneNumber, String otpCode, String newPassword) {
        log.info("Resetting password: phone={}", phoneNumber);
        
        // Normalize phone number
        String normalizedPhone = normalizePhoneNumber(phoneNumber);
        
        // Find user by phone number
        User user = userRepository.findByPhone(normalizedPhone)
                .orElseThrow(() -> new BadRequestException("Kullanıcı bulunamadı"));
        
        // Verify OTP code again
        if (user.getOtpCode() == null || !user.getOtpCode().equals(otpCode)) {
            log.warn("Invalid OTP code for password reset: user={}", user.getEmail());
            throw new BadRequestException("Geçersiz doğrulama kodu");
        }
        
        // Check if OTP has expired
        if (user.getOtpExpiry() == null || user.getOtpExpiry().isBefore(java.time.LocalDateTime.now())) {
            log.warn("Expired OTP code for password reset: user={}", user.getEmail());
            throw new BadRequestException("Doğrulama kodunun süresi dolmuş");
        }
        
        // Check if OTP was verified
        if (!Boolean.TRUE.equals(user.getOtpVerified())) {
            log.warn("OTP not verified for password reset: user={}", user.getEmail());
            throw new BadRequestException("Lütfen önce doğrulama kodunu onaylayın");
        }
        
        // Update password with BCrypt encoding
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        
        // Clear OTP data
        user.setOtpCode(null);
        user.setOtpExpiry(null);
        user.setOtpVerified(false);
        
        userRepository.save(user);
        
        log.info("Password reset successful for user: {}", user.getId());
    }
    
    /**
     * DEPRECATED: Şifre sıfırlama isteği (eski sistem)
     */
    @Transactional
    public VerificationResponse forgotPassword(String phoneNumber) {
        log.info("Password reset requested for: {}", phoneNumber);
        
        User user = userRepository.findByPhone(phoneNumber)
                .orElseThrow(() -> new BadRequestException("Bu telefon numarasına kayıtlı kullanıcı bulunamadı"));
        
        // Send verification code
        String code = smsService.sendVerificationCode(phoneNumber);
        
        VerificationResponse response = new VerificationResponse();
        response.setSuccess(true);
        response.setMessage("Şifre sıfırlama kodu gönderildi");
        response.setPhoneNumber(phoneNumber);
        // For testing only - remove in production
        response.setCode(code);
        
        return response;
    }
    
    /**
     * DEPRECATED: Şifre sıfırlama (eski sistem)
     */
    @Transactional
    public void resetPassword(String phoneNumber, String verificationCode, String newPassword) {
        log.info("Resetting password for: {}", phoneNumber);
        
        // Verify code
        boolean isValid = smsService.verifyCode(phoneNumber, verificationCode);
        if (!isValid) {
            throw new BadRequestException("Geçersiz veya süresi dolmuş doğrulama kodu");
        }
        
        // Find user
        User user = userRepository.findByPhone(phoneNumber)
                .orElseThrow(() -> new BadRequestException("Kullanıcı bulunamadı"));
        
        // Update password
        // TEMPORARY: Plain text password (NOT SECURE!)
        // TODO: Enable BCrypt after testing
        // user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setPasswordHash(newPassword);
        
        userRepository.save(user);
        
        log.info("Password reset successful for user: {}", user.getId());
    }

    /**
     * Generate 6-digit OTP code
     */
    private String generateOtpCode() {
        return String.format("%06d", (int)(Math.random() * 1000000));
    }
    
    /**
     * Get user's apartment ID from residency_history
     */
    private String getUserApartmentId(String userId) {
        try {
            // Query residency_history to find active apartment
            String query = "SELECT apartment_id FROM residency_history " +
                          "WHERE user_id = :userId AND status = 'active' " +
                          "ORDER BY move_in_date DESC LIMIT 1";
            
            var result = entityManager.createNativeQuery(query)
                    .setParameter("userId", userId)
                    .getResultList();
            
            if (!result.isEmpty()) {
                return (String) result.get(0);
            }
        } catch (Exception e) {
            log.warn("Could not find apartment for user {}: {}", userId, e.getMessage());
        }
        return null;
    }
    
    /**
     * Normalize phone number
     * +905551234567 -> 5551234567
     * 905551234567 -> 5551234567
     * 05551234567 -> 5551234567
     */
    private String normalizePhoneNumber(String phone) {
        if (phone == null) return null;
        
        // Remove all non-digit characters
        String cleaned = phone.replaceAll("[^0-9]", "");
        
        // Remove +90, 90, 0 prefixes
        if (cleaned.startsWith("90")) {
            cleaned = cleaned.substring(2);
        }
        if (cleaned.startsWith("0")) {
            cleaned = cleaned.substring(1);
        }
        
        return cleaned;
    }
}
