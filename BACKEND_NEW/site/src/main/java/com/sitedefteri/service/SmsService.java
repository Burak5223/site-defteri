package com.sitedefteri.service;

import com.sitedefteri.entity.SmsVerificationCode;
import com.sitedefteri.repository.SmsVerificationCodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class SmsService {
    
    private final SmsVerificationCodeRepository smsVerificationCodeRepository;
    private final Random random = new Random();
    
    @Transactional
    public String sendVerificationCode(String phoneNumber) {
        // Generate 6-digit code
        String code = String.format("%06d", random.nextInt(999999));
        
        // Deactivate previous codes for this phone
        smsVerificationCodeRepository.deactivatePreviousCodes(phoneNumber);
        
        // Create new verification code
        SmsVerificationCode verificationCode = new SmsVerificationCode();
        verificationCode.setPhoneNumber(phoneNumber);
        verificationCode.setCode(code);
        verificationCode.setExpiresAt(LocalDateTime.now().plusMinutes(5));
        verificationCode.setIsUsed(false);
        verificationCode.setAttempts(0);
        
        smsVerificationCodeRepository.save(verificationCode);
        
        // TODO: Integrate with actual SMS provider (Twilio, Netgsm, etc.)
        log.info("SMS Verification Code for {}: {}", phoneNumber, code);
        log.info("⚠️ SMS integration not implemented yet. Code logged for testing.");
        
        return code; // Return for testing purposes only
    }
    
    @Transactional
    public boolean verifyCode(String phoneNumber, String code) {
        SmsVerificationCode verificationCode = smsVerificationCodeRepository
                .findByPhoneNumberAndVerificationCodeAndIsVerifiedFalse(phoneNumber, code)
                .orElse(null);
        
        if (verificationCode == null) {
            log.warn("Invalid verification code for phone: {}", phoneNumber);
            return false;
        }
        
        // Check if expired
        if (verificationCode.getExpiresAt().isBefore(LocalDateTime.now())) {
            log.warn("Expired verification code for phone: {}", phoneNumber);
            return false;
        }
        
        // Check attempts
        if (verificationCode.getAttempts() >= 3) {
            log.warn("Too many attempts for phone: {}", phoneNumber);
            return false;
        }
        
        // Mark as used
        verificationCode.setIsUsed(true);
        verificationCode.setVerifiedAt(LocalDateTime.now());
        smsVerificationCodeRepository.save(verificationCode);
        
        log.info("Phone verified successfully: {}", phoneNumber);
        return true;
    }
    
    @Transactional
    public void incrementAttempts(String phoneNumber, String code) {
        smsVerificationCodeRepository.findByPhoneNumberAndVerificationCodeAndIsVerifiedFalse(phoneNumber, code)
                .ifPresent(verificationCode -> {
                    verificationCode.setAttempts(verificationCode.getAttempts() + 1);
                    smsVerificationCodeRepository.save(verificationCode);
                });
    }
}
