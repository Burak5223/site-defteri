package com.sitedefteri.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Firebase Authentication Service
 * 
 * Firebase Phone Auth ile gelen ID token'ları doğrular
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FirebaseAuthService {
    
    /**
     * Firebase ID Token'ı doğrula ve telefon numarasını al
     * 
     * @param idToken Firebase ID Token
     * @return Telefon numarası
     */
    public String verifyTokenAndGetPhone(String idToken) {
        log.info("Verifying Firebase token...");
        
        // Firebase Admin SDK ile token doğrulama (uncomment when Firebase is enabled)
        /*
        try {
            FirebaseToken decodedToken = FirebaseAuth.getInstance()
                .verifyIdToken(idToken);
            
            String uid = decodedToken.getUid();
            String phone = (String) decodedToken.getClaims().get("phone_number");
            
            log.info("✅ Token verified - UID: {}, Phone: {}", uid, phone);
            return phone;
            
        } catch (Exception e) {
            log.error("❌ Token verification failed: {}", e.getMessage());
            throw new RuntimeException("Invalid Firebase token");
        }
        */
        
        // Development mode: Mock verification
        log.warn("⚠️  Firebase disabled - using mock verification");
        return "+905551234567"; // Mock phone number
    }
    
    /**
     * Firebase token'dan kullanıcı bilgilerini al
     */
    public FirebaseUserInfo getUserInfo(String idToken) {
        String phone = verifyTokenAndGetPhone(idToken);
        
        FirebaseUserInfo info = new FirebaseUserInfo();
        info.setPhone(phone);
        info.setVerified(true);
        
        return info;
    }
    
    /**
     * Firebase kullanıcı bilgileri
     */
    @lombok.Data
    public static class FirebaseUserInfo {
        private String phone;
        private String email;
        private boolean verified;
    }
}
