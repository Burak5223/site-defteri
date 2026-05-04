package com.sitedefteri.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;

import javax.annotation.PostConstruct;
import java.io.InputStream;

/**
 * Firebase Configuration - PRODUCTION MODE
 * 
 * Bu class Firebase Admin SDK'yı başlatır.
 * Service Account key dosyası src/main/resources/firebase-service-account.json konumunda olmalı.
 * 
 * Eğer dosya bulunamazsa, development mode'da çalışır (bildirimler sadece log'a yazılır).
 */
@Configuration
@Slf4j
public class FirebaseConfig {
    
    @PostConstruct
    public void initialize() {
        try {
            // Service Account key'i resources klasöründen oku
            // Önce firebase-adminsdk.json'u dene, yoksa firebase-service-account.json'u dene
            InputStream serviceAccount = getClass()
                .getClassLoader()
                .getResourceAsStream("firebase-adminsdk.json");
            
            if (serviceAccount == null) {
                serviceAccount = getClass()
                    .getClassLoader()
                    .getResourceAsStream("firebase-service-account.json");
            }

            if (serviceAccount == null) {
                log.warn("⚠️  Firebase service account key NOT FOUND!");
                log.warn("⚠️  Firebase running in DEVELOPMENT MODE");
                log.warn("📝 To enable production mode:");
                log.warn("   1. Download service account key from Firebase Console");
                log.warn("   2. Place firebase-adminsdk.json in src/main/resources/");
                log.warn("   3. Rebuild: mvn clean package -DskipTests");
                log.warn("   4. Restart backend");
                return;
            }

            // Firebase options oluştur
            FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                .build();

            // Firebase'i başlat (eğer daha önce başlatılmamışsa)
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
                log.info("✅ Firebase initialized successfully - PRODUCTION MODE");
                log.info("🔥 Firebase Admin SDK is ready");
                log.info("📱 Push notifications enabled");
                log.info("🔐 SMS authentication enabled");
            } else {
                log.info("✅ Firebase already initialized");
            }
            
        } catch (Exception e) {
            log.error("❌ Firebase initialization failed: {}", e.getMessage());
            log.warn("⚠️  Continuing without Firebase (development mode)");
            log.warn("📝 Check if firebase-service-account.json is valid");
        }
    }
}
