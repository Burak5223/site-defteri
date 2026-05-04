package com.sitedefteri.repository;

import com.sitedefteri.entity.SmsVerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SmsVerificationCodeRepository extends JpaRepository<SmsVerificationCode, String> {
    
    Optional<SmsVerificationCode> findByPhoneNumberAndVerificationCodeAndPurposeAndIsVerifiedFalse(
        String phoneNumber, 
        String verificationCode, 
        SmsVerificationCode.VerificationPurpose purpose
    );
    
    List<SmsVerificationCode> findByPhoneNumberAndPurposeAndIsVerifiedFalseAndExpiresAtAfter(
        String phoneNumber,
        SmsVerificationCode.VerificationPurpose purpose,
        LocalDateTime now
    );
    
    void deleteByExpiresAtBefore(LocalDateTime now);
    
    // Additional methods for compatibility
    Optional<SmsVerificationCode> findByPhoneNumberAndVerificationCodeAndIsVerifiedFalse(String phoneNumber, String verificationCode);
    
    @Modifying
    @Query("UPDATE SmsVerificationCode s SET s.isVerified = true WHERE s.phoneNumber = :phoneNumber AND s.isVerified = false")
    void deactivatePreviousCodes(String phoneNumber);
}
